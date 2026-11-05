import { Link } from "@tanstack/react-router"
import LogOut from "lucide-react/icons/log-out"
import User from "lucide-react/icons/user"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { useAuth } from "@core/hooks"
import { Button } from "@ui/button"
import { Popover, PopoverPanel, PopoverTrigger } from "@ui/popover"

export function TopBar() {
    return (
        <div
            data-slot="top-bar"
            className="sticky top-0 z-40 w-full border-b border-stone-200/60 bg-background/80 backdrop-blur-md"
        >
            <div className="mx-auto flex h-14 w-full max-w-350 items-center justify-between px-4 sm:px-6 lg:px-12">
                <Link
                    to="/"
                    viewTransition
                    className="flex items-center gap-2 text-stone-900 transition-colors duration-150 ease hover:text-tomato-600"
                >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-tomato-100 text-tomato-600">
                        <UtensilsCrossed className="size-4" />
                    </div>
                    <span className="font-display text-lg font-semibold">Next Bite</span>
                </Link>

                <div className="flex items-center gap-3">
                    <AuthButton />
                </div>
            </div>
        </div>
    )
}

function AuthButton() {
    const auth = useAuth()

    if (!auth.isAuthenticated) {
        return (
            <Button render={<Link to="/login" viewTransition />} size="md" nativeButton={false}>
                Sign In
            </Button>
        )
    }

    return (
        <Popover>
            <PopoverTrigger tone="tinted" aria-label="Open account menu" className="size-8">
                {auth.user?.image !== undefined && auth.user?.image !== null && auth.user.image !== "" ? (
                    <img
                        src={auth.user.image}
                        alt={auth.user?.name ?? "User"}
                        className="size-8 rounded-full object-cover"
                    />
                ) : (
                    <User className="size-4" aria-hidden="true" />
                )}
            </PopoverTrigger>
            <PopoverPanel className="w-56">
                <div className="border-b border-stone-200 px-4 py-2">
                    <p className="text-sm font-medium text-stone-900">{auth.user?.name ?? "User"}</p>
                    <p className="text-xs text-stone-600">{auth.user?.email}</p>
                </div>
                <button
                    onClick={() => {
                        void auth.signOut()
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 focus:bg-stone-100"
                >
                    <LogOut className="size-4" aria-hidden="true" />
                    Sign Out
                </button>
            </PopoverPanel>
        </Popover>
    )
}
