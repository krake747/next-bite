import {
    AppWindowIcon,
    CaretDownIcon,
    CardsIcon,
    ChatTextIcon,
    CircleDashedIcon,
    CircleNotchIcon,
    ColumnsIcon,
    CursorClickIcon,
    ForkKnifeIcon,
    HouseIcon,
    ImageIcon,
    LinkIcon,
    ListIcon,
    MinusIcon,
    PaletteIcon,
    QuotesIcon,
    RectangleIcon,
    RowsIcon,
    ShapesIcon,
    SidebarIcon,
    TagIcon,
    TextAaIcon,
    TextboxIcon,
    TrayIcon,
    UserCircleIcon,
    UsersIcon,
    WarningCircleIcon,
} from "@phosphor-icons/react"
import { Link, useMatchRoute } from "@tanstack/react-router"

import { cva, cx } from "@ui/cva.config"
import { useIsMobile } from "@ui/hooks/use-media-query"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarRail,
    SidebarTrigger,
} from "@ui/sidebar"
import { TooltipProvider } from "@ui/tooltip"
import { focusRing } from "@ui/variants"

import { designSystemSections } from "../-sections/registry"

const sectionIcons: Record<string, typeof HouseIcon> = {
    palette: PaletteIcon,
    typography: TextAaIcon,
    shape: ShapesIcon,
    loading: CircleNotchIcon,
    "aspect-ratio": ImageIcon,
    avatar: UserCircleIcon,
    badge: TagIcon,
    button: RectangleIcon,
    card: CardsIcon,
    collapsible: CaretDownIcon,
    dialog: AppWindowIcon,
    "dropdown-menu": ListIcon,
    "empty-state": TrayIcon,
    "icon-button": CursorClickIcon,
    input: TextboxIcon,
    popover: ChatTextIcon,
    "query-error": WarningCircleIcon,
    separator: MinusIcon,
    sheet: SidebarIcon,
    sidebar: ColumnsIcon,
    skeleton: CircleDashedIcon,
    "social-metadata": UsersIcon,
    tabs: RowsIcon,
    "text-link": LinkIcon,
    tooltip: QuotesIcon,
}

type SectionEntry = {
    readonly id: string
    readonly title: string
    readonly Icon: typeof HouseIcon
}

const sections: ReadonlyArray<SectionEntry> = Object.values(designSystemSections).map((entry) => ({
    id: entry.meta.id,
    title: entry.meta.title,
    Icon: sectionIcons[entry.meta.id] ?? HouseIcon,
}))

const item = cva({
    base: "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground data-[status=active]:bg-tomato-100 data-[status=active]:text-tomato-700 md:w-full md:flex-row md:gap-3 md:px-3 md:py-2 md:text-sm",
    composes: [focusRing],
})

export function DesignSystemNav() {
    const matchRoute = useMatchRoute()
    const isMobile = useIsMobile()
    if (isMobile) {
        return (
            <nav
                aria-label="Design system"
                data-slot="ds-nav"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md"
            >
                <div className="mx-auto grid w-full max-w-350 grid-cols-5 gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                    <Link to="/ds" className={cx(item())}>
                        <HouseIcon className="size-5 shrink-0" aria-hidden="true" />
                        <span>Overview</span>
                    </Link>
                    {sections.map((section) => (
                        <Link
                            key={section.id}
                            to="/ds/$sectionId"
                            params={{ sectionId: section.id }}
                            className={cx(item())}
                        >
                            <section.Icon className="size-5 shrink-0" aria-hidden="true" />
                            <span>{section.title}</span>
                        </Link>
                    ))}
                </div>
            </nav>
        )
    }
    return (
        <TooltipProvider>
            <SidebarProvider className="contents">
                <Sidebar collapsible="icon">
                    <SidebarHeader>
                        <div className="flex items-center gap-1">
                            <Link
                                to="/ds"
                                aria-label="Design system home"
                                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-foreground group-data-[collapsible=icon]:hidden hover:text-tomato-600"
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-tomato-100 text-tomato-600">
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
                            {sections.map((section) => (
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
                    </SidebarContent>
                    <SidebarRail />
                </Sidebar>
            </SidebarProvider>
        </TooltipProvider>
    )
}
