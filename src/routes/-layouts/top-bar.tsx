import { ForkKnifeIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { useAuth } from "@core/hooks"
import { Button } from "@ui/button"
import { Popover, PopoverPanel, PopoverTrigger } from "@ui/popover"

export function TopBar() {
    return (
        <div
            data-slot="top-bar"
            className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md"
        >
            <div className="mx-auto flex h-14 w-full max-w-350 items-center justify-between px-4 sm:px-6 lg:px-12">
                <Link
                    to="/"
                    viewTransition
                    className="flex items-center gap-2 text-stone-900 transition-colors duration-150 ease hover:text-tomato-600"
                >
                    <div className="flex size-8 items-center justify-center rounded-lg bg-tomato-100 text-tomato-600">
                        <ForkKnifeIcon className="size-4" />
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
        return <Button render={<Link to="/login" viewTransition />}>Sign In</Button>
    }

    return (
        <Popover>
            <PopoverTrigger tone="tinted" aria-label="Open account menu" className="size-8">
                {auth.user?.image !== undefined && auth.user?.image !== null && auth.user.image !== "" ? (
                    <img
                        src={auth.user.image}
                        alt={auth.user?.name ?? "UserIcon"}
                        className="size-8 rounded-full object-cover"
                    />
                ) : (
                    <UserIcon className="size-4" />
                )}
            </PopoverTrigger>
            <PopoverPanel className="w-56">
                <div className="border-b border-border px-4 py-2">
                    <p className="text-sm font-medium text-stone-900">{auth.user?.name ?? "UserIcon"}</p>
                    <p className="text-xs text-stone-600">{auth.user?.email}</p>
                </div>
                <button
                    onClick={() => {
                        void auth.signOut()
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-100 focus:bg-stone-100"
                >
                    <SignOutIcon className="size-4" />
                    Sign Out
                </button>
            </PopoverPanel>
        </Popover>
    )
}
