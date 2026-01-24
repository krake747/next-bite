import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import { DarkModeToggle } from "./dark-mode-toggle"
import type { JSX } from "solid-js"

export function Header(props: { children?: JSX.Element }) {
    return (
        <header class="px-6 py-16 sm:py-24 lg:px-8 lg:py-32 dark:bg-neutral-900">
            <div class="mx-auto max-w-2xl text-center">
                <div class="inline-flex size-12 items-center justify-center rounded-2xl bg-flame-pea-100 text-flame-pea-600 sm:size-16">
                    <UtensilsCrossed class="size-6 sm:size-8" />
                </div>
                {props.children ?? <DefaultChildren />}
                <p class="mt-4 flex items-center justify-center">
                    <DarkModeToggle />
                </p>
            </div>
        </header>
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

export function HeaderTitle(props: JSX.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h1 class="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white">
            {props.children}
        </h1>
    )
}

export function HeaderSubtitle(props: JSX.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p class="mt-4 text-lg font-medium text-pretty text-neutral-500 sm:text-xl/8 dark:text-neutral-400">
            {props.children}
        </p>
    )
}
