import { Popover } from "@base-ui/react/popover"
import { Link } from "@tanstack/react-router"
import LogOut from "lucide-react/icons/log-out"
import User from "lucide-react/icons/user"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { useAuth } from "@core/hooks"

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
                    <span className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                        Next Bite
                    </span>
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
            <Link
                to="/login"
                viewTransition
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-tomato-700 px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-tomato-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tomato-700 active:scale-[0.97]"
            >
                Sign In
            </Link>
        )
    }

    return (
        <Popover.Root>
            <Popover.Trigger
                aria-label="Open account menu"
                className="flex size-8 items-center justify-center rounded-full bg-tomato-100 text-tomato-600 transition-colors duration-150 ease hover:bg-tomato-200"
            >
                {auth.user?.image !== undefined && auth.user?.image !== null && auth.user.image !== "" ? (
                    <img
                        src={auth.user.image}
                        alt={auth.user?.name ?? "User"}
                        className="size-8 rounded-full object-cover"
                    />
                ) : (
                    <User className="size-4" aria-hidden="true" />
                )}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner>
                    <Popover.Popup className="z-50 mt-2 w-56 rounded-lg border border-stone-200 bg-surface py-2 shadow-lg">
                        <div className="border-b border-stone-200 px-4 py-2">
                            <p className="text-sm font-medium text-stone-900">{auth.user?.name ?? "User"}</p>
                            <p className="text-xs text-stone-500">{auth.user?.email}</p>
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
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    )
}
