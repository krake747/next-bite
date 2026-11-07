import { HouseIcon, PlusIcon, UserCircleIcon, UsersIcon, UsersThreeIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { useOpenAddRestaurant } from "@features/restaurants/add-restaurant-provider"
import { cva, cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

const destinations = [
    { label: "Home", to: "/", Icon: HouseIcon },
    { label: "Friends", to: "/friends", Icon: UsersIcon },
    { label: "Groups", to: "/groups", Icon: UsersThreeIcon },
    { label: "You", to: "/you", Icon: UserCircleIcon },
] as const

const item = cva({
    base: "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors duration-150 ease hover:bg-surface-muted hover:text-foreground data-[status=active]:bg-tomato-100 data-[status=active]:text-tomato-700 md:w-full md:flex-row md:gap-3 md:px-3 md:py-2 md:text-sm",
    composes: [focusRing],
})

function AppLink({ to, label, Icon }: Readonly<{ to: string; label: string; Icon: typeof HouseIcon }>) {
    return (
        <Link to={to} viewTransition className={cx(item())}>
            <Icon className="size-5 shrink-0 md:size-4" aria-hidden="true" />
            <span>{label}</span>
        </Link>
    )
}

export function AppNav() {
    const openAdd = useOpenAddRestaurant()
    // Authenticated only: PageLayout renders no nav for signed-out visitors, who navigate
    // through the TopBar sign-in action instead.
    return (
        <nav
            aria-label="Primary"
            data-slot="app-nav"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-md md:static md:z-auto md:w-56 md:shrink-0 md:border-t-0 md:border-r md:bg-transparent md:backdrop-blur-none"
        >
            <div className="mx-auto grid w-full max-w-350 grid-cols-5 gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:flex md:flex-col md:gap-1 md:p-4">
                <AppLink to={destinations[0].to} label={destinations[0].label} Icon={destinations[0].Icon} />
                <AppLink to={destinations[1].to} label={destinations[1].label} Icon={destinations[1].Icon} />
                <button type="button" onClick={openAdd} className={cx(item(), "cursor-pointer")}>
                    <PlusIcon className="size-5 shrink-0 md:size-4" aria-hidden="true" />
                    <span>Add</span>
                </button>
                <AppLink to={destinations[2].to} label={destinations[2].label} Icon={destinations[2].Icon} />
                <AppLink to={destinations[3].to} label={destinations[3].label} Icon={destinations[3].Icon} />
            </div>
        </nav>
    )
}
