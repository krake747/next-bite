import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
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
                <div class="absolute -top-20 -right-20 h-[200%] w-32 rotate-12 bg-linear-to-b from-flame-pea-100/50 via-flame-pea-50/30 to-transparent dark:from-flame-pea-900/20 dark:via-flame-pea-900/10" />
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

export function HeaderTitle(props: ComponentProps<"h1">) {
    return (
        <h1
            class="text-4xl leading-[0.9] font-semibold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl dark:text-white"
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
        <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-flame-pea-100 py-2 pr-4 pl-2 text-sm font-semibold text-flame-pea-700 dark:bg-flame-pea-900/50 dark:text-flame-pea-400">
            <span class="flex size-6 items-center justify-center rounded-full bg-flame-pea-600 text-xs text-white dark:bg-flame-pea-500">
                {props.count}
            </span>
            <span>places to try</span>
        </div>
    )
}
