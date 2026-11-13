import { ForkKnifeIcon, HouseIcon } from "@phosphor-icons/react"
import { Link, useMatchRoute } from "@tanstack/react-router"

import { cva, cx } from "@ui/cva.config"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
} from "@ui/sidebar"
import { focusRing } from "@ui/variants"

import { designSystemSections, sectionGroups, sectionIcons } from "../-sections/registry"

type SectionNavItem = {
    readonly id: string
    readonly title: string
    readonly group: string
    readonly Icon: typeof HouseIcon
}

const sections: ReadonlyArray<SectionNavItem> = Object.values(designSystemSections).map((entry) => ({
    id: entry.meta.id,
    title: entry.meta.title,
    group: entry.meta.group,
    Icon: sectionIcons[entry.meta.id] ?? HouseIcon,
}))

const mobileLink = cva({
    base: "flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-sidebar-accent-foreground",
    composes: [focusRing],
})

export function DesignSystemMenuList({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
    const matchRoute = useMatchRoute()
    const isIndexActive = matchRoute({ to: "/ds", fuzzy: false }) !== false
    return (
        <nav aria-label="Design system" data-slot="ds-menu-list" className="flex flex-col gap-6 py-4">
            <Link
                to="/ds"
                data-status={isIndexActive ? "active" : undefined}
                className={cx(mobileLink())}
                onClick={() => {
                    onNavigate?.()
                }}
            >
                <HouseIcon className="size-5 shrink-0" aria-hidden="true" />
                <span>Overview</span>
            </Link>
            {sectionGroups.map((group) => (
                <section key={group} aria-label={group}>
                    <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        {group}
                    </p>
                    <ul className="flex flex-col gap-1">
                        {sections
                            .filter((section) => section.group === group)
                            .map((section) => (
                                <li key={section.id}>
                                    <Link
                                        to="/ds/$sectionId"
                                        params={{ sectionId: section.id }}
                                        className={cx(mobileLink())}
                                        onClick={() => {
                                            onNavigate?.()
                                        }}
                                    >
                                        <section.Icon className="size-5 shrink-0" aria-hidden="true" />
                                        <span>{section.title}</span>
                                    </Link>
                                </li>
                            ))}
                    </ul>
                </section>
            ))}
        </nav>
    )
}

export function DesignSystemSidebar() {
    const matchRoute = useMatchRoute()
    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <div className="flex items-center gap-1">
                    <Link
                        to="/ds"
                        aria-label="Design system home"
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-foreground group-data-[collapsible=icon]:hidden hover:text-primary"
                    >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-primary">
                            <ForkKnifeIcon className="size-4" aria-hidden="true" />
                        </span>
                        <span className="truncate font-display text-lg font-semibold">Design system</span>
                    </Link>
                    <SidebarTrigger />
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            isActive={matchRoute({ to: "/ds", fuzzy: false }) !== false}
                            render={<Link to="/ds" />}
                            tooltip="Overview"
                        >
                            <HouseIcon aria-hidden="true" />
                            <span>Overview</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                {sectionGroups.map((group) => (
                    <SidebarGroup key={group}>
                        <SidebarGroupLabel>{group}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {sections
                                    .filter((section) => section.group === group)
                                    .map((section) => (
                                        <SidebarMenuItem key={section.id}>
                                            <SidebarMenuButton
                                                isActive={
                                                    matchRoute({
                                                        to: "/ds/$sectionId",
                                                        params: { sectionId: section.id },
                                                    }) !== false
                                                }
                                                render={<Link to="/ds/$sectionId" params={{ sectionId: section.id }} />}
                                                tooltip={section.title}
                                            >
                                                <section.Icon aria-hidden="true" />
                                                <span>{section.title}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
