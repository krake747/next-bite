import { CircleNotchIcon, ForkKnifeIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"

import { BrandIcon } from "./brand-icon"

export function AppInitializing({ className }: Readonly<{ className?: string | undefined }>) {
    return (
        <div
            role="status"
            aria-label="Starting Next Bite"
            data-slot="app-initializing"
            className={cx(
                "flex min-h-dvh w-full flex-col items-center justify-center gap-4 bg-background px-4",
                className,
            )}
        >
            <span className="motion-safe:animate-pulse">
                <BrandIcon size="sm">
                    <ForkKnifeIcon className="size-6" aria-hidden="true" />
                </BrandIcon>
            </span>
            <p className="font-display text-lg font-semibold text-foreground">Next Bite</p>
        </div>
    )
}

export function LoadingPlaceholder() {
    return (
        <div
            role="status"
            aria-label="Loading"
            data-slot="section-loading"
            className="flex w-full items-center justify-center py-16"
        >
            <CircleNotchIcon className="size-7 text-muted-foreground motion-safe:animate-spin" aria-hidden="true" />
        </div>
    )
}

export function InlineLoading({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <p role="status" data-slot="inline-loading" className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleNotchIcon className="size-4 shrink-0 motion-safe:animate-spin" aria-hidden="true" />
            {children}
        </p>
    )
}
