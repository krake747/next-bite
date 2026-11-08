import { Input as BaseInput } from "@base-ui/react/input"
import { CaretDownIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { Link, useLocation, useMatchRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { cx } from "@ui/cva.config"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@ui/sidebar"
import { control, focusRing } from "@ui/variants"

import { designSystemSections, sectionGroups, type SectionEntry } from "../-sections/registry"

function isSectionActive(matchRoute: ReturnType<typeof useMatchRoute>, sectionId: string, exact: boolean): boolean {
    if (exact) {
        return matchRoute({ to: "/ds", fuzzy: false }) !== false
    }
    return matchRoute({ to: "/ds/$sectionId", params: { sectionId } }) !== false
}

function ChildItem({ sectionId, id, title }: Readonly<{ sectionId: string; id: string; title: string }>) {
    const { hash } = useLocation()
    return (
        <SidebarMenuSubItem key={id}>
            <SidebarMenuSubButton
                isActive={hash === `#${id}`}
                render={<Link to="/ds/$sectionId" params={{ sectionId }} hash={id} />}
            >
                <span>{title}</span>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    )
}

function ParentSection({ entry, pageActive }: Readonly<{ entry: SectionEntry; pageActive: boolean }>) {
    const children = entry.meta.children ?? []
    const [open, setOpen] = useState(pageActive)
    useEffect(() => {
        if (pageActive) {
            setOpen(true)
        }
    }, [pageActive])

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={pageActive}
                render={<Link to="/ds/$sectionId" params={{ sectionId: entry.meta.id }} />}
            >
                <span>{entry.meta.title}</span>
            </SidebarMenuButton>
            <SidebarMenuAction
                showOnHover
                aria-expanded={open}
                aria-label={open ? `Collapse ${entry.meta.title}` : `Expand ${entry.meta.title}`}
                onClick={() => {
                    setOpen(!open)
                }}
            >
                <CaretDownIcon className={cx("transition-transform duration-150", open && "rotate-180")} />
            </SidebarMenuAction>
            {open && (
                <SidebarMenuSub>
                    {children.map((child) => (
                        <ChildItem key={child.id} sectionId={entry.meta.id} id={child.id} title={child.title} />
                    ))}
                </SidebarMenuSub>
            )}
        </SidebarMenuItem>
    )
}

function SectionRow({ entry, pageActive }: Readonly<{ entry: SectionEntry; pageActive: boolean }>) {
    if ((entry.meta.children ?? []).length > 0) {
        return <ParentSection entry={entry} pageActive={pageActive} />
    }
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                isActive={pageActive}
                render={<Link to="/ds/$sectionId" params={{ sectionId: entry.meta.id }} />}
            >
                <span>{entry.meta.title}</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}

export function DesignSystemNav() {
    const matchRoute = useMatchRoute()
    const [query, setQuery] = useState("")
    const needle = query.trim().toLowerCase()
    const filtering = needle !== ""
    const matches = filtering
        ? Object.values(designSystemSections).filter(
              (entry) =>
                  entry.meta.title.toLowerCase().includes(needle) ||
                  (entry.meta.children ?? []).some((child) => child.title.toLowerCase().includes(needle)),
          )
        : []

    return (
        <>
            <div className="px-2 pt-2">
                <div className="relative">
                    <MagnifyingGlassIcon
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <BaseInput
                        data-slot="ds-nav-search"
                        type="search"
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value)
                        }}
                        placeholder="Search"
                        aria-label="Search sections"
                        className={cx(control(), "py-2 pr-9 pl-9 text-sm")}
                    />
                    {query !== "" && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("")
                            }}
                            aria-label="Clear search"
                            className={cx(
                                focusRing(),
                                "absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground",
                            )}
                        >
                            <XIcon className="size-4" aria-hidden="true" />
                        </button>
                    )}
                </div>
            </div>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton isActive={isSectionActive(matchRoute, "", true)} render={<Link to="/ds" />}>
                        <span>Overview</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            {filtering ? (
                <SidebarMenu>
                    {matches.map((entry) => (
                        <SectionRow
                            key={entry.meta.id}
                            entry={entry}
                            pageActive={isSectionActive(matchRoute, entry.meta.id, false)}
                        />
                    ))}
                    {matches.length === 0 && (
                        <li className="px-3 py-2 text-sm text-muted-foreground">No matching sections.</li>
                    )}
                </SidebarMenu>
            ) : (
                sectionGroups.map((group) => (
                    <SidebarGroup key={group}>
                        <SidebarGroupLabel>{group}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {Object.values(designSystemSections)
                                    .filter((entry) => entry.meta.group === group)
                                    .map((entry) => (
                                        <SectionRow
                                            key={entry.meta.id}
                                            entry={entry}
                                            pageActive={isSectionActive(matchRoute, entry.meta.id, false)}
                                        />
                                    ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))
            )}
        </>
    )
}
