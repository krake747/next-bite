import {
    CaretUpDownIcon,
    ForkKnifeIcon,
    HouseIcon,
    PlusIcon,
    SignOutIcon,
    UserCircleIcon,
    UserIcon,
    UsersIcon,
    UsersThreeIcon,
} from "@phosphor-icons/react"
import { Link, useMatchRoute } from "@tanstack/react-router"

import { useConvexQuery } from "@api/convex.context"
import { api } from "@api/endpoints"
import { useAuth } from "@core/session"
import { useOpenAddRestaurant } from "@features/restaurants/add-restaurant-provider"
import { LazyImage } from "@pattern/lazy-image"
import { cva, cx } from "@ui/cva.config"
import { useIsMobile } from "@ui/hooks/use-media-query"
import { Popover, PopoverPanel, PopoverTrigger } from "@ui/popover"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
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

const destinations = [
    { label: "Home", to: "/", Icon: HouseIcon },
    { label: "Friends", to: "/friends", Icon: UsersIcon },
    { label: "Groups", to: "/groups", Icon: UsersThreeIcon },
] as const

const item = cva({
    base: "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground data-[status=active]:bg-tomato-100 data-[status=active]:text-tomato-700 md:w-full md:flex-row md:gap-3 md:px-3 md:py-2 md:text-sm",
    composes: [focusRing],
})

function hasImageValue(image: string | null | undefined): image is string {
    return image !== undefined && image !== null && image !== ""
}

type SessionUserLike = {
    readonly name?: string | null | undefined
    readonly email?: string | null | undefined
    readonly image?: string | null | undefined
}

type CardIdentity = {
    readonly name: string
    readonly email: string
    readonly image: string | undefined
    readonly hasImage: boolean
}

function sessionIdentity(user: SessionUserLike | null | undefined): CardIdentity {
    const image = user?.image ?? undefined
    return {
        name: user?.name ?? "You",
        email: user?.email ?? "",
        image,
        hasImage: hasImageValue(image),
    }
}

function profileIdentity(
    profile: {
        readonly name: string
        readonly email: string
        readonly avatar?: { readonly url?: string | null | undefined } | null | undefined
    },
    user: SessionUserLike | null | undefined,
): CardIdentity {
    const image = profile.avatar?.url ?? user?.image ?? undefined
    return {
        name: profile.name,
        email: profile.email,
        image,
        hasImage: hasImageValue(image),
    }
}

function useUserCardIdentity(): CardIdentity {
    const auth = useAuth()
    // The Convex profile is the source of truth for display identity; the
    // auth session only refreshes at login, so it goes stale after a rename.
    const profile = useConvexQuery(api.users.getMe)
    if (profile?.status === "ready") {
        return profileIdentity(profile.profile, auth.user)
    }
    return sessionIdentity(auth.user)
}

function SidebarUserMenu() {
    const auth = useAuth()
    const matchRoute = useMatchRoute()
    const isAccountActive = matchRoute({ to: "/you" }) !== false
    const { name, email, image, hasImage } = useUserCardIdentity()
    return (
        <div className="group-data-[collapsible=icon]:hidden">
            <Popover>
                <PopoverTrigger tone="card" aria-label="Open account menu">
                    {hasImage ? (
                        <LazyImage src={image} alt={name} className="size-8 rounded-full object-cover" />
                    ) : (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
                            <UserIcon className="size-4" aria-hidden="true" />
                        </span>
                    )}
                    <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{email}</span>
                    </span>
                    <CaretUpDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverPanel side="right" align="end" sideOffset={8} className="w-60">
                    <div className="mb-1 border-b border-border px-3 py-2.5">
                        <p className="truncate text-sm font-medium text-foreground">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">{email}</p>
                    </div>
                    <Link
                        to="/you"
                        data-active={isAccountActive}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-muted focus:outline-none focus-visible:bg-surface-muted data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground data-active:hover:bg-sidebar-accent"
                    >
                        <UserCircleIcon className="size-4" aria-hidden="true" />
                        Account
                    </Link>
                    <button
                        type="button"
                        onClick={() => {
                            void auth.signOut()
                        }}
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-surface-muted focus:outline-none focus-visible:bg-surface-muted"
                    >
                        <SignOutIcon className="size-4" aria-hidden="true" />
                        Log out
                    </button>
                </PopoverPanel>
            </Popover>
        </div>
    )
}

export function AppNav() {
    const openAdd = useOpenAddRestaurant()
    const matchRoute = useMatchRoute()
    const isMobile = useIsMobile()
    // Authenticated only: PageLayout renders no nav for signed-out visitors, who navigate
    // through the TopBar instead. Mobile gets bottom tabs, desktop gets the sidebar.
    if (isMobile) {
        return (
            <nav
                aria-label="Primary"
                data-slot="app-nav"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md"
            >
                <div className="mx-auto grid w-full max-w-350 grid-cols-4 gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                    <AppLink to={destinations[0].to} label={destinations[0].label} Icon={destinations[0].Icon} />
                    <AppLink to={destinations[1].to} label={destinations[1].label} Icon={destinations[1].Icon} />
                    <button type="button" onClick={openAdd} className={cx(item(), "cursor-pointer")}>
                        <PlusIcon className="size-5 shrink-0" aria-hidden="true" />
                        <span>Add</span>
                    </button>
                    <AppLink to={destinations[2].to} label={destinations[2].label} Icon={destinations[2].Icon} />
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
                                to="/"
                                aria-label="Next Bite home"
                                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-foreground group-data-[collapsible=icon]:hidden hover:text-tomato-600"
                            >
                                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-tomato-100 text-tomato-600">
                                    <ForkKnifeIcon className="size-4" aria-hidden="true" />
                                </span>
                                <span className="truncate font-display text-lg font-semibold">Next Bite</span>
                            </Link>
                            <SidebarTrigger />
                        </div>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarMenu>
                            {destinations.map((destination) => (
                                <SidebarMenuItem key={destination.to}>
                                    <SidebarMenuButton
                                        render={<Link to={destination.to} />}
                                        isActive={
                                            matchRoute({ to: destination.to, fuzzy: destination.to !== "/" }) !== false
                                        }
                                        tooltip={destination.label}
                                    >
                                        <destination.Icon aria-hidden="true" />
                                        <span>{destination.label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            <SidebarMenuItem>
                                <SidebarMenuButton onClick={openAdd} tooltip="Add">
                                    <PlusIcon aria-hidden="true" />
                                    <span>Add</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                    <SidebarFooter>
                        <SidebarUserMenu />
                    </SidebarFooter>
                    <SidebarRail />
                </Sidebar>
            </SidebarProvider>
        </TooltipProvider>
    )
}

function AppLink({ to, label, Icon }: Readonly<{ to: string; label: string; Icon: typeof HouseIcon }>) {
    return (
        <Link to={to} className={cx(item())}>
            <Icon className="size-5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
        </Link>
    )
}
