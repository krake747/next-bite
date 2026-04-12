import { Show } from "solid-js"
import { DropdownMenu } from "@kobalte/core/dropdown-menu"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import User from "lucide-solid/icons/user"
import LogOut from "lucide-solid/icons/log-out"
import { DarkModeToggle } from "./dark-mode-toggle"
import { useAuth } from "../core/hooks"
import { Button } from "../ui/button"
import type { ComponentProps, JSX } from "solid-js"

export function Header(props: { children?: JSX.Element }) {
    return (
        <header class="relative overflow-hidden border-b border-neutral-200/60 bg-[#faf9f7] dark:border-white/10 dark:bg-[#1a1918]">
            {/* Subtle texture overlay */}
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    "background-image": `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Decorative diagonal stripe */}
            <div class="pointer-events-none absolute inset-0 overflow-hidden">
                <div class="absolute -top-20 -right-20 h-[200%] w-32 rotate-12 bg-gradient-to-b from-flame-pea-100/50 via-flame-pea-50/30 to-transparent dark:from-flame-pea-900/20 dark:via-flame-pea-900/10" />
            </div>

            <div class="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
                <div class="flex items-start justify-between gap-8">
                    {/* Main content - left side */}
                    <div class="flex-1">{props.children ?? <DefaultChildren />}</div>

                    {/* Visual anchor - right side */}
                    <div class="hidden shrink-0 flex-col items-end gap-4 sm:flex">
                        <div class="relative">
                            <div class="flex size-16 items-center justify-center rounded-2xl bg-flame-pea-100 text-flame-pea-600 shadow-sm lg:size-20 dark:bg-flame-pea-900/50 dark:text-flame-pea-400">
                                <UtensilsCrossed class="size-8 lg:size-10" />
                            </div>
                            {/* Small decorative circle */}
                            <div class="absolute -bottom-2 -left-2 size-6 rounded-full bg-flame-pea-500/20 dark:bg-flame-pea-500/30" />
                        </div>
                    </div>
                </div>

                {/* Bottom utility bar */}
                <div class="mt-8 flex items-center justify-between border-t border-neutral-200/60 pt-6 dark:border-white/10">
                    <div class="flex items-center gap-4">
                        <DarkModeToggle />
                    </div>
                    <AuthButton />
                </div>
            </div>
        </header>
    )
}

function AuthButton() {
    const auth = useAuth()

    return (
        <Show
            when={auth.isAuthenticated()}
            fallback={
                <a href="/login">
                    <Button size="md">Sign In</Button>
                </a>
            }
        >
            <DropdownMenu>
                <DropdownMenu.Trigger
                    aria-label="Open account menu"
                    class="flex size-10 items-center justify-center rounded-full bg-flame-pea-100 text-flame-pea-600 transition-colors hover:bg-flame-pea-200 dark:bg-flame-pea-900 dark:text-flame-pea-400 dark:hover:bg-flame-pea-800"
                >
                    <Show when={auth.user()?.image} fallback={<User class="size-5" aria-hidden="true" />}>
                        {(image) => (
                            <img
                                src={image()}
                                alt={auth.user()?.name ?? "User"}
                                class="size-10 rounded-full object-cover"
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
        <h1
            class="text-4xl leading-[0.9] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white"
            style={{ "font-family": "var(--font-display)" }}
        >
            {props.children}
        </h1>
    )
}

export function HeaderSubtitle(props: ComponentProps<"p">) {
    return (
        <p class="mt-4 max-w-lg text-lg leading-relaxed font-medium text-pretty text-neutral-600 dark:text-neutral-400">
            {props.children}
        </p>
    )
}

export function HeaderBadge(props: { count: number }) {
    return (
        <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-flame-pea-100 px-4 py-2 text-sm font-semibold text-flame-pea-700 dark:bg-flame-pea-900/50 dark:text-flame-pea-400">
            <span class="flex size-6 items-center justify-center rounded-full bg-flame-pea-600 text-xs text-white dark:bg-flame-pea-500">
                {props.count}
            </span>
            <span>places to try</span>
        </div>
    )
}
