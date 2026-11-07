import { ForkKnifeIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"

import { BackgroundLayers } from "./background-decoration"
import { BrandIcon } from "./brand-icon"

export function Header({ children, className, ...props }: Readonly<React.ComponentProps<"header">>) {
    return (
        <header
            data-slot="header"
            className={cx("relative overflow-hidden border-b border-border bg-background", className)}
            {...props}
        >
            <BackgroundLayers />

            <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-12 lg:py-20">
                <div className="flex min-h-70 items-center justify-between gap-12">
                    <div className="max-w-2xl flex-1">{children ?? <DefaultChildren />}</div>

                    <div className="hidden shrink-0 items-center justify-center pr-1 sm:flex">
                        <BrandIcon size="lg">
                            <ForkKnifeIcon className="size-10" />
                        </BrandIcon>
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
            data-slot="header-title"
            className={cx(
                "relative font-display text-5xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl",
                className,
            )}
            {...props}
        >
            <span className="relative inline-block">
                {children}
                <div className="absolute -bottom-2 left-0 h-2 w-full overflow-hidden">
                    <svg
                        className="size-full text-tomato-400"
                        viewBox="0 0 100 8"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                    >
                        <path
                            d="M0 6 Q25 0 50 6 T100 6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </span>
        </h1>
    )
}

export function HeaderSubtitle({ children, className, ...props }: Readonly<React.ComponentProps<"p">>) {
    return (
        <p
            data-slot="header-subtitle"
            className={cx("mt-6 max-w-xl text-xl leading-relaxed text-pretty text-muted-foreground", className)}
            {...props}
        >
            {children}
        </p>
    )
}

export function HeaderBadge({ count }: Readonly<{ count: number }>) {
    return (
        <p
            data-slot="header-badge"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-foreground"
        >
            <span className="font-semibold text-foreground tabular-nums">{count}</span>
            places to try
        </p>
    )
}
