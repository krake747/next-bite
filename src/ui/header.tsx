import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { cx } from "@ui/cva.config"

import { BackgroundLayers } from "./background-decoration"

export function Header({ children, ...props }: Readonly<React.ComponentProps<"header">>) {
    return (
        <header data-slot="header" className="relative overflow-hidden border-b border-border bg-background" {...props}>
            <BackgroundLayers />

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `linear-gradient(color-mix(in oklch, var(--color-stone-900) 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--color-stone-900) 5%, transparent) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-12 lg:py-20">
                <div className="flex min-h-70 items-center justify-between gap-12">
                    <div className="max-w-2xl flex-1">{children ?? <DefaultChildren />}</div>

                    <div className="hidden shrink-0 items-center justify-center sm:flex">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-tomato-500/20 blur-2xl" />

                            <div className="relative flex size-20 items-center justify-center rounded-card bg-linear-to-br from-tomato-500 to-tomato-600 text-white shadow-popover">
                                <UtensilsCrossed className="size-10" />
                            </div>
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

export function HeaderTitle({ children, className, ...props }: Readonly<React.ComponentProps<"h1">>) {
    return (
        <h1
            className={cx(
                "relative font-display text-5xl leading-tight font-semibold tracking-tight text-balance text-stone-900 sm:text-6xl lg:text-7xl",
                className,
            )}
            {...props}
        >
            <span className="relative inline-block">
                {children}
                <div className="absolute -bottom-2 left-0 h-2 w-full overflow-hidden">
                    <div
                        className="size-full origin-left bg-size-[100%_100%]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'%3E%3Cpath d='M0 6 Q25 0 50 6 T100 6' fill='none' stroke='oklch(0.692%200.158%2033.75)' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        }}
                    />
                </div>
            </span>
        </h1>
    )
}

export function HeaderSubtitle({ children, className, ...props }: Readonly<React.ComponentProps<"p">>) {
    return (
        <p className={cx("mt-6 max-w-xl text-xl leading-relaxed text-pretty text-stone-600", className)} {...props}>
            {children}
        </p>
    )
}

export function HeaderBadge({ count }: Readonly<{ count: number }>) {
    return (
        <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-surface/80 py-1 pr-4 pl-1 text-sm font-semibold text-stone-700 shadow-card ring-1 ring-border backdrop-blur-sm">
            <span className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-tomato-500 to-tomato-600 text-white tabular-nums shadow-inner">
                {count}
            </span>
            <span>places to try</span>
        </div>
    )
}
