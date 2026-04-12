import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import { createSignal, onMount, onCleanup, createMemo, type ComponentProps, type JSX } from "solid-js"

export function Header(props: { children?: JSX.Element }) {
    const [scrollY, setScrollY] = createSignal(0)

    onMount(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY)
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        onCleanup(() => window.removeEventListener("scroll", handleScroll))
    })

    // Parallax multipliers for each blob
    const parallax1 = createMemo(() => scrollY() * 0.15)
    const parallax2 = createMemo(() => scrollY() * -0.1)
    const parallax3 = createMemo(() => scrollY() * 0.08)

    return (
        <header
            data-component="header"
            class="relative overflow-hidden border-b border-neutral-200/60 bg-[#faf9f7] dark:border-white/10 dark:bg-[#1a1918]"
        >
            <div
                class="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
                style={{
                    "background-image": `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
            />

            <div class="pointer-events-none absolute inset-0">
                <div class="absolute top-0 left-0 h-full w-1/2 bg-linear-to-br from-flame-pea-100/40 via-transparent to-transparent dark:from-flame-pea-900/20" />
                <div class="absolute right-0 bottom-0 h-full w-1/2 bg-linear-to-tl from-orange-100/30 via-transparent to-transparent dark:from-orange-900/10" />
            </div>

            {/* Parallax floating blobs */}
            <div
                class="animate-float pointer-events-none absolute top-[20%] left-[10%] h-32 w-32 rounded-full bg-flame-pea-300/15 blur-[80px] will-change-transform"
                style={{ transform: `translateY(${parallax1()}px)` }}
            />
            <div
                class="animate-float pointer-events-none absolute right-[15%] bottom-[10%] h-24 w-24 rounded-full bg-orange-300/10 blur-[60px] will-change-transform"
                style={{ "animation-delay": "1s", transform: `translateY(${parallax2()}px)` }}
            />
            <div
                class="animate-float pointer-events-none absolute top-[60%] right-[30%] h-16 w-16 rounded-full bg-flame-pea-400/10 blur-[50px] will-change-transform"
                style={{ "animation-delay": "2s", transform: `translateY(${parallax3()}px)` }}
            />

            <div
                class="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
                style={{
                    "background-image": `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                    "background-size": "60px 60px",
                }}
            />

            <div class="relative mx-auto w-full max-w-350 px-4 py-10 sm:px-6 sm:py-14 lg:px-12 lg:py-20">
                <div class="flex min-h-70 items-center justify-between gap-12">
                    <div class="max-w-2xl flex-1">{props.children ?? <DefaultChildren />}</div>

                    <div class="hidden shrink-0 items-center justify-center sm:flex">
                        <div class="relative">
                            <div class="absolute inset-0 rounded-full bg-flame-pea-500/20 blur-2xl" />
                            <div class="absolute inset-0 animate-pulse rounded-full bg-flame-pea-400/10 blur-xl" />
                            <div class="relative flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white shadow-[0_8px_30px_rgb(181,57,32,0.3)] transition-all duration-200 hover:shadow-[0_10px_35px_rgb(181,57,32,0.35)] dark:from-flame-pea-600 dark:to-flame-pea-700 dark:shadow-[0_8px_30px_rgb(181,57,32,0.4)] dark:hover:shadow-[0_10px_35px_rgb(181,57,32,0.45)]">
                                <UtensilsCrossed class="size-10" />
                            </div>
                            <div class="animate-float-dot-1 absolute top-0 -right-3 size-4 rounded-full bg-yellow-400" />
                            <div class="animate-float-dot-2 absolute -bottom-2 -left-2 size-3 rounded-full bg-flame-pea-400" />
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
            class="relative text-5xl leading-tight font-semibold tracking-tight text-neutral-900 sm:text-6xl lg:text-7xl dark:text-white"
            style={{ "font-family": "var(--font-display)" }}
        >
            <span class="relative inline-block">
                {props.children}
                <div class="absolute -bottom-2 left-0 h-2 w-full overflow-hidden">
                    <div
                        class="animate-line-reveal h-full w-full origin-left bg-size-[100%_100%]"
                        style={{
                            "background-image": `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'%3E%3Cpath d='M0 6 Q25 0 50 6 T100 6' fill='none' stroke='%23eb6348' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        }}
                    />
                </div>
            </span>
        </h1>
    )
}

export function HeaderSubtitle(props: ComponentProps<"p">) {
    return <p class="mt-6 max-w-xl text-xl leading-relaxed text-neutral-600 dark:text-neutral-400">{props.children}</p>
}

export function HeaderBadge(props: { count: number }) {
    return (
        <div class="mt-8 inline-flex items-center gap-3 rounded-full bg-white/80 px-1 py-1 text-sm font-semibold text-neutral-700 shadow-[0_2px_10px_rgb(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-sm transition-shadow duration-200 hover:shadow-[0_4px_16px_rgb(0,0,0,0.12)] dark:bg-white/10 dark:text-neutral-200 dark:shadow-[0_2px_10px_rgb(0,0,0,0.3)] dark:ring-white/10 dark:hover:shadow-[0_4px_16px_rgb(0,0,0,0.4)]">
            <span class="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white shadow-inner">
                {props.count}
            </span>
            <span class="pr-3">places to try</span>
        </div>
    )
}
