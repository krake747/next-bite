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
import { useAuth, useSessionStatus } from "@core/session"
import { LazyImage } from "@pattern/lazy-image"
import { cva, cx } from "@ui/cva.config"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui/dropdown-menu"
import { useIsMobile } from "@ui/hooks/use-media-query"
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
import { useSidebar } from "@ui/sidebar.context"
import { TooltipProvider } from "@ui/tooltip"
import { focusRing } from "@ui/variants"

const destinations = [
    { label: "Home", to: "/home", Icon: HouseIcon },
    { label: "Friends", to: "/friends", Icon: UsersIcon },
    { label: "Groups", to: "/groups", Icon: UsersThreeIcon },
    { label: "You", to: "/you", Icon: UserIcon },
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
    const status = useSessionStatus()
    const profile = useConvexQuery(api.identity.me, undefined, { skip: status.kind !== "ready" })
    if (profile?.status === "ready") {
        return profileIdentity(profile.profile, auth.user)
    }
    return sessionIdentity(auth.user)
}

function UserAvatar({
    name,
    image,
    hasImage,
}: Readonly<{ name: string; image: string | undefined; hasImage: boolean }>) {
    if (hasImage) {
        return <LazyImage src={image} alt={name} className="size-8 rounded-full object-cover" />
    }
    return (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
            <UserIcon className="size-4" aria-hidden="true" />
        </span>
    )
}

function AccountMenuContent({
    name,
    email,
    isAccountActive,
    onSignOut,
}: Readonly<{ name: string; email: string; isAccountActive: boolean; onSignOut: () => void }>) {
    return (
        <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-60">
            <div className="mb-1 border-b border-border px-3 py-2.5">
                <p className="truncate text-sm font-medium text-foreground">{name}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <DropdownMenuItem active={isAccountActive} render={<Link to="/account" />}>
                <UserCircleIcon className="size-4" aria-hidden="true" />
                Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>
                <SignOutIcon className="size-4" aria-hidden="true" />
                Log out
            </DropdownMenuItem>
        </DropdownMenuContent>
    )
}

function SidebarUserMenu() {
    const auth = useAuth()
    const matchRoute = useMatchRoute()
    const { state } = useSidebar()
    const isAccountActive = matchRoute({ to: "/account" }) !== false
    const { name, email, image, hasImage } = useUserCardIdentity()
    const signOut = () => {
        void auth.signOut()
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label="Open account menu"
                render={
                    state === "collapsed" ? (
                        <button
                            type="button"
                            className={cx(
                                focusRing(),
                                "hit-area-2 inline-flex cursor-pointer items-center justify-center rounded-full hover:bg-surface-muted",
                            )}
                        >
                            <UserAvatar name={name} image={image} hasImage={hasImage} />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={cx(
                                focusRing(),
                                "hit-area-2 inline-flex w-full cursor-pointer items-center justify-start gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface-muted",
                            )}
                        >
                            <UserAvatar name={name} image={image} hasImage={hasImage} />
                            <span className="min-w-0 flex-1 text-left">
                                <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                                <span className="block truncate text-xs text-muted-foreground">{email}</span>
                            </span>
                            <CaretUpDownIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        </button>
                    )
                }
            />
            <AccountMenuContent name={name} email={email} isAccountActive={isAccountActive} onSignOut={signOut} />
        </DropdownMenu>
    )
}

export function AppNav() {
    const matchRoute = useMatchRoute()
    const isMobile = useIsMobile()
    if (isMobile) {
        return (
            <nav
                aria-label="Primary"
                data-slot="app-nav"
                className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-md"
            >
                <div className="mx-auto grid w-full max-w-350 grid-cols-5 gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
                    <AppLink to={destinations[0].to} label={destinations[0].label} Icon={destinations[0].Icon} />
                    <AppLink to={destinations[1].to} label={destinations[1].label} Icon={destinations[1].Icon} />
                    <AppLink to="/add" label="Add" Icon={PlusIcon} />
                    <AppLink to={destinations[2].to} label={destinations[2].label} Icon={destinations[2].Icon} />
                    <AppLink to={destinations[3].to} label={destinations[3].label} Icon={destinations[3].Icon} />
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
                                to="/home"
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
                                            matchRoute({ to: destination.to, fuzzy: destination.to !== "/home" }) !==
                                            false
                                        }
                                        tooltip={destination.label}
                                    >
                                        <destination.Icon aria-hidden="true" />
                                        <span>{destination.label}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                            <SidebarMenuItem>
                                <SidebarMenuButton render={<Link to="/add" />} tooltip="Add">
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
