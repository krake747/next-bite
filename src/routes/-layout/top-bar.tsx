import { Popover } from "@base-ui/react/popover"
import { Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"
import User from "lucide-react/icons/user"
import LogOut from "lucide-react/icons/log-out"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@core/hooks"

export function TopBar() {
    return (
        <div
            data-component="top-bar"
            className="sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-[#faf9f7]/80 backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/80"
        >
            <div className="mx-auto flex h-14 w-full max-w-350 items-center justify-between px-4 sm:px-6 lg:px-12">
                <Link
                    to="/"
                    viewTransition
                    className="flex items-center gap-2 text-neutral-900 transition-colors duration-150 ease hover:text-flame-pea-600 dark:text-neutral-100 dark:hover:text-flame-pea-400"
                >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-flame-pea-100 text-flame-pea-600 dark:bg-flame-pea-900/50 dark:text-flame-pea-400">
                        <UtensilsCrossed className="size-4" />
                    </div>
                    <span className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                        Next Bite
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
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
                className="inline-flex cursor-pointer items-center justify-center rounded-md bg-flame-pea-700 px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-flame-pea-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-pea-700 active:scale-[0.97] dark:bg-flame-pea-800 dark:text-white dark:shadow-none dark:hover:bg-flame-pea-700 dark:focus-visible:outline-flame-pea-50"
            >
                Sign In
            </Link>
        )
    }

    return (
        <Popover.Root>
            <Popover.Trigger
                aria-label="Open account menu"
                className="flex size-8 items-center justify-center rounded-full bg-flame-pea-100 text-flame-pea-600 transition-colors duration-150 ease hover:bg-flame-pea-200 dark:bg-flame-pea-900 dark:text-flame-pea-400 dark:hover:bg-flame-pea-800"
            >
                {auth.user?.image ? (
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
                    <Popover.Popup className="z-50 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                        <div className="border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                {auth.user?.name ?? "User"}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{auth.user?.email}</p>
                        </div>
                        <button
                            onClick={() => {
                                void auth.signOut()
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
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
