import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { BackgroundLayers } from "./background-decoration"

export function Header({ children }: Readonly<{ children?: React.ReactNode | undefined }>) {
    return (
        <header data-slot="header" className="relative overflow-hidden border-b border-stone-200/60 bg-background">
            <BackgroundLayers />

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="relative mx-auto w-full max-w-350 px-4 py-10 sm:px-6 sm:py-14 lg:px-12 lg:py-20">
                <div className="flex min-h-70 items-center justify-between gap-12">
                    <div className="max-w-2xl flex-1">{children ?? <DefaultChildren />}</div>

                    <div className="hidden shrink-0 items-center justify-center sm:flex">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-tomato-500/20 blur-2xl" />

                            <div className="relative flex size-20 items-center justify-center rounded-2xl bg-linear-to-br from-tomato-500 to-tomato-600 text-white shadow-[0_8px_30px_rgb(181,57,32,0.3)]">
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

export function HeaderTitle({
    children,
    className,
    ...props
}: Readonly<{ children?: React.ReactNode | undefined; className?: string | undefined }>) {
    return (
        <h1
            className={`relative text-5xl leading-tight font-semibold tracking-tight text-stone-900 sm:text-6xl lg:text-7xl ${className ?? ""}`}
            style={{ fontFamily: "var(--font-display)" }}
            {...props}
        >
            <span className="relative inline-block">
                {children}
                <div className="absolute -bottom-2 left-0 h-2 w-full overflow-hidden">
                    <div
                        className="h-full w-full origin-left bg-size-[100%_100%]"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 8' preserveAspectRatio='none'%3E%3Cpath d='M0 6 Q25 0 50 6 T100 6' fill='none' stroke='%23eb6348' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E")`,
                        }}
                    />
                </div>
            </span>
        </h1>
    )
}

export function HeaderSubtitle({
    children,
    className,
    ...props
}: Readonly<{ children?: React.ReactNode | undefined; className?: string | undefined }>) {
    return (
        <p className={`mt-6 max-w-xl text-xl leading-relaxed text-stone-600 ${className ?? ""}`} {...props}>
            {children}
        </p>
    )
}

export function HeaderBadge({ count }: Readonly<{ count: number }>) {
    return (
        <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-surface/80 px-1 py-1 text-sm font-semibold text-stone-700 shadow-[0_2px_10px_rgb(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-tomato-500 to-tomato-600 text-white shadow-inner">
                {count}
            </span>
            <span className="pr-3">places to try</span>
        </div>
    )
}
