import { UsersThreeIcon } from "@phosphor-icons/react"

import { AvatarGroup } from "@pattern/avatar-group"
import { ButtonLink } from "@pattern/button-link"
import { LazyImage } from "@pattern/lazy-image"
import { Skeleton } from "@ui/skeleton"

export type LandingTaste = {
    readonly name: string
    readonly cuisine: string
    readonly location: string
    readonly saverName: string
    readonly imageUrl?: string | undefined
    readonly createdAt: number
}

export type LandingStats = {
    readonly totalRestaurants: number
    readonly totalWants: number
    readonly topCuisines: ReadonlyArray<{ readonly cuisine: string; readonly count: number }>
    readonly recentAdds: ReadonlyArray<LandingTaste>
}

export function timeAgo(timestamp: number, now: number = Date.now()): string {
    const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
    if (seconds < 60) {
        return "just now"
    }
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
        return `${minutes}m ago`
    }
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `${hours}h ago`
    }
    const days = Math.floor(hours / 24)
    if (days < 7) {
        return `${days}d ago`
    }
    return new Date(timestamp).toLocaleDateString()
}

export function LandingActions() {
    return (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ButtonLink to="/signup" size="lg">
                Get started
            </ButtonLink>
        </div>
    )
}

function TasteCard({ taste }: Readonly<{ taste: LandingTaste }>) {
    const firstName = taste.saverName.split(" ")[0] ?? taste.saverName
    const action = taste.imageUrl === undefined ? "saved a spot" : "shared a photo"
    return (
        <article className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="flex items-center gap-3 p-4 pb-3">
                <AvatarGroup members={[{ name: taste.saverName }]} max={1} />
                <p className="flex-1 text-sm text-foreground">
                    <strong className="font-semibold">{firstName}</strong> {action}
                </p>
                <p className="text-xs whitespace-nowrap text-muted-foreground">{timeAgo(taste.createdAt)}</p>
            </div>
            {taste.imageUrl !== undefined && (
                <div className="px-4">
                    <LazyImage src={taste.imageUrl} alt={taste.name} aspectRatio="16/10" className="rounded-lg" />
                </div>
            )}
            <div className="p-4 pt-3">
                <p className="font-display text-lg font-semibold text-balance text-foreground">{taste.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    {taste.cuisine} · {taste.location}
                </p>
            </div>
        </article>
    )
}

export function TasteCards({ tastes }: Readonly<{ tastes: ReadonlyArray<LandingTaste> }>) {
    if (tastes.length === 0) {
        return null
    }
    return (
        <section
            aria-label="Sample community activity"
            className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-6 lg:px-12"
        >
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">A taste of Nextbite</h2>
            <p className="mt-1 text-muted-foreground">Sample community activity</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {tastes.map((taste) => (
                    <TasteCard key={`${taste.name}-${taste.createdAt}`} taste={taste} />
                ))}
            </div>
        </section>
    )
}

export function TasteCardsSkeleton() {
    return (
        <section
            aria-busy="true"
            aria-label="Sample community activity"
            className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-6 lg:px-12"
        >
            <Skeleton className="h-8 w-56" />
            <Skeleton className="mt-2 h-4 w-48" />
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {[0, 1, 2].map((index) => (
                    <div key={index} className="overflow-hidden rounded-card border border-border bg-surface">
                        <div className="flex items-center gap-3 p-4 pb-3">
                            <Skeleton className="size-8 rounded-full" />
                            <Skeleton className="h-4 flex-1 rounded" />
                            <Skeleton className="h-3 w-10 rounded" />
                        </div>
                        <div className="px-4">
                            <Skeleton className="aspect-16/10 w-full rounded-lg" />
                        </div>
                        <div className="p-4 pt-3">
                            <Skeleton className="h-6 w-2/3 rounded" />
                            <Skeleton className="mt-2 h-4 w-1/2 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export function LandingCloser() {
    return (
        <section aria-label="Get started" className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-12">
            <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <UsersThreeIcon className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                        <h2 className="font-display text-lg font-semibold text-balance text-foreground">
                            Find your next favourite, together.
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Get started and start saving spots with your friends.
                        </p>
                    </div>
                </div>
                <ButtonLink to="/signup" size="lg" className="shrink-0">
                    Get started
                </ButtonLink>
            </div>
        </section>
    )
}
