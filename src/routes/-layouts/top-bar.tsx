import { ForkKnifeIcon, SignOutIcon, UserIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { useAuth } from "@core/session"
import { LazyImage } from "@pattern/lazy-image"
import { Button } from "@ui/button"
import { Popover, PopoverPanel, PopoverTrigger } from "@ui/popover"

export function TopBar() {
    return (
        <div
            data-slot="top-bar"
            className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md"
        >
            <div className="mx-auto flex h-14 w-full max-w-350 items-center justify-between px-4 sm:px-6 lg:px-12">
                <Link to="/" className="flex items-center gap-2 text-foreground hover:text-tomato-600">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-tomato-100 text-tomato-600">
                        <ForkKnifeIcon className="size-4" aria-hidden="true" />
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
        return <Button render={<Link to="/login" />}>Sign In</Button>
    }

    return (
        <Popover>
            <PopoverTrigger tone="tinted" aria-label="Open your menu" className="size-8">
                {auth.user?.image !== undefined && auth.user?.image !== null && auth.user.image !== "" ? (
                    <LazyImage
                        src={auth.user.image}
                        alt={auth.user?.name ?? "UserIcon"}
                        className="size-8 rounded-full object-cover"
                    />
                ) : (
                    <UserIcon className="size-4" aria-hidden="true" />
                )}
            </PopoverTrigger>
            <PopoverPanel className="w-56">
                <div className="border-b border-border px-4 py-2">
                    <p className="text-sm font-medium text-foreground">{auth.user?.name ?? "UserIcon"}</p>
                    <p className="text-xs text-muted-foreground">{auth.user?.email}</p>
                </div>
                <button
                    onClick={() => {
                        void auth.signOut()
                    }}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-surface-muted focus:bg-surface-muted"
                >
                    <SignOutIcon className="size-4" aria-hidden="true" />
                    Sign Out
                </button>
            </PopoverPanel>
        </Popover>
    )
}
