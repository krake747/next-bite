import { Show, createSignal } from "solid-js"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import User from "lucide-solid/icons/user"
import LogOut from "lucide-solid/icons/log-out"
import { DarkModeToggle } from "./dark-mode-toggle"
import { useAuth } from "../core/hooks"
import { Button } from "../ui/button"
import type { ComponentProps, JSX } from "solid-js"

export function Header(props: { children?: JSX.Element }) {
    return (
        <header class="px-6 py-16 sm:py-24 lg:px-8 lg:py-32 dark:bg-neutral-900">
            <div class="mx-auto max-w-2xl text-center">
                <div class="inline-flex size-12 items-center justify-center rounded-2xl bg-flame-pea-100 text-flame-pea-600 sm:size-16">
                    <UtensilsCrossed class="size-6 sm:size-8" />
                </div>
                {props.children ?? <DefaultChildren />}
                <p class="mt-4 flex items-center justify-center gap-4">
                    <DarkModeToggle />
                    <AuthButton />
                </p>
            </div>
        </header>
    )
}

function AuthButton() {
    const auth = useAuth()
    const [showMenu, setShowMenu] = createSignal(false)

    return (
        <Show
            when={auth.isAuthenticated()}
            fallback={
                <a href="/login">
                    <Button size="md">Sign In</Button>
                </a>
            }
        >
            <div class="relative">
                <button
                    onClick={() => setShowMenu(!showMenu())}
                    class="flex size-10 items-center justify-center rounded-full bg-flame-pea-100 text-flame-pea-600 hover:bg-flame-pea-200 dark:bg-flame-pea-900 dark:text-flame-pea-400"
                >
                    <Show when={auth.user()?.image} fallback={<User class="size-5" />}>
                        {(image) => (
                            <img
                                src={image()}
                                alt={auth.user()?.name ?? "User"}
                                class="size-10 rounded-full object-cover"
                            />
                        )}
                    </Show>
                </button>

                <Show when={showMenu()}>
                    <div class="absolute top-full right-0 z-50 mt-2 w-48 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                        <div class="border-b border-neutral-200 px-4 py-2 dark:border-neutral-700">
                            <p class="text-sm font-medium text-neutral-900 dark:text-white">
                                {auth.user()?.name ?? "User"}
                            </p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">{auth.user()?.email}</p>
                        </div>
                        <button
                            onClick={() => {
                                void auth.signOut()
                                setShowMenu(false)
                            }}
                            class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                            <LogOut class="size-4" />
                            Sign Out
                        </button>
                    </div>
                </Show>
            </div>
        </Show>
    )
}

function DefaultChildren() {
    return (
        <>
            <HeaderTitle>Our next bite</HeaderTitle>
            <HeaderSubtitle>We enjoy hanging out together and having a laugh</HeaderSubtitle>
        </>
    )
}

export function HeaderTitle(props: ComponentProps<"h1">) {
    return (
        <h1 class="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white">
            {props.children}
        </h1>
    )
}

export function HeaderSubtitle(props: ComponentProps<"p">) {
    return (
        <p class="mt-4 text-lg font-medium text-pretty text-neutral-500 sm:text-xl/8 dark:text-neutral-400">
            {props.children}
        </p>
    )
}
