import { Show } from "solid-js"
import { DropdownMenu } from "@kobalte/core/dropdown-menu"
import { Link } from "@tanstack/solid-router"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import User from "lucide-solid/icons/user"
import LogOut from "lucide-solid/icons/log-out"
import { DarkModeToggle } from "./dark-mode-toggle"
import { useAuth } from "../core/hooks"

export function TopBar() {
    return (
        <div
            data-component="top-bar"
            class="sticky top-0 z-40 w-full border-b border-neutral-200/60 bg-[#faf9f7]/80 backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/80"
        >
            <div class="mx-auto flex h-14 w-full max-w-350 items-center justify-between px-4 sm:px-6 lg:px-12">
                <Link
                    to="/"
                    viewTransition
                    class="flex items-center gap-2 text-neutral-900 transition-colors duration-150 ease hover:text-flame-pea-600 dark:text-neutral-100 dark:hover:text-flame-pea-400"
                >
                    <div class="flex size-8 items-center justify-center rounded-lg bg-flame-pea-100 text-flame-pea-600 dark:bg-flame-pea-900/50 dark:text-flame-pea-400">
                        <UtensilsCrossed class="size-4" />
                    </div>
                    <span class="text-lg font-semibold" style={{ "font-family": "var(--font-display)" }}>
                        Next Bite
                    </span>
                </Link>

                <div class="flex items-center gap-3">
                    <DarkModeToggle />
                    <AuthButton />
                </div>
            </div>
        </div>
    )
}

function AuthButton() {
    const auth = useAuth()

    return (
        <Show
            when={auth.isAuthenticated()}
            fallback={
                <Link
                    to="/login"
                    viewTransition
                    class="rounded-md bg-flame-pea-600 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 ease hover:bg-flame-pea-700 dark:bg-flame-pea-500 dark:hover:bg-flame-pea-600"
                >
                    Sign In
                </Link>
            }
        >
            <DropdownMenu>
                <DropdownMenu.Trigger
                    aria-label="Open account menu"
                    class="flex size-8 items-center justify-center rounded-full bg-flame-pea-100 text-flame-pea-600 transition-colors duration-150 ease hover:bg-flame-pea-200 dark:bg-flame-pea-900 dark:text-flame-pea-400 dark:hover:bg-flame-pea-800"
                >
                    <Show when={auth.user()?.image} fallback={<User class="size-4" aria-hidden="true" />}>
                        {(image) => (
                            <img
                                src={image()}
                                alt={auth.user()?.name ?? "User"}
                                class="size-8 rounded-full object-cover"
                            />
                        )}
                    </Show>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content class="z-50 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                        <div class="border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
                            <p class="text-sm font-medium text-neutral-900 dark:text-white">
                                {auth.user()?.name ?? "User"}
                            </p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">{auth.user()?.email}</p>
                        </div>
                        <DropdownMenu.Item
                            onSelect={() => {
                                void auth.signOut()
                            }}
                            class="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
                        >
                            <LogOut class="size-4" aria-hidden="true" />
                            Sign Out
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu>
        </Show>
    )
}
