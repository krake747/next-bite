import { Link } from "@tanstack/react-router"
import House from "lucide-react/icons/house"
import Plus from "lucide-react/icons/plus"
import UserRound from "lucide-react/icons/user-round"
import Users from "lucide-react/icons/users"
import UsersRound from "lucide-react/icons/users-round"

import { cx } from "@ui/cva.config"

const destinations = [
    { label: "Home", to: "/", Icon: House },
    { label: "Friends", to: "/friends", Icon: Users },
    { label: "Groups", to: "/groups", Icon: UsersRound },
    { label: "You", to: "/you", Icon: UserRound },
] as const

const itemClasses =
    "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-stone-600 transition-colors duration-150 ease hover:bg-stone-100 hover:text-stone-900 data-[status=active]:bg-tomato-100 data-[status=active]:text-tomato-700 md:w-full md:flex-row md:gap-3 md:px-3 md:py-2 md:text-sm"

function AppLink({ to, label, Icon }: Readonly<{ to: string; label: string; Icon: typeof House }>) {
    return (
        <Link to={to} viewTransition className={cx(itemClasses)}>
            <Icon className="size-5 shrink-0 md:size-4" />
            <span>{label}</span>
        </Link>
    )
}

export function AppNav({ onAddClick }: Readonly<{ onAddClick: () => void }>) {
    // Authenticated only: PageLayout renders no nav for signed-out visitors, who navigate
    // through the TopBar sign-in action instead.
    return (
        <nav
            aria-label="Primary"
            data-slot="app-nav"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200/60 bg-background/90 backdrop-blur-md md:static md:z-auto md:w-56 md:shrink-0 md:border-t-0 md:border-r md:bg-transparent md:backdrop-blur-none"
        >
            <div className="mx-auto grid w-full max-w-350 grid-cols-5 gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:flex md:flex-col md:gap-1 md:p-4">
                <AppLink to={destinations[0].to} label={destinations[0].label} Icon={destinations[0].Icon} />
                <AppLink to={destinations[1].to} label={destinations[1].label} Icon={destinations[1].Icon} />
                <button type="button" onClick={onAddClick} className={cx(itemClasses, "cursor-pointer")}>
                    <Plus className="size-5 shrink-0 md:size-4" />
                    <span>Add</span>
                </button>
                <AppLink to={destinations[2].to} label={destinations[2].label} Icon={destinations[2].Icon} />
                <AppLink to={destinations[3].to} label={destinations[3].label} Icon={destinations[3].Icon} />
            </div>
        </nav>
    )
}
