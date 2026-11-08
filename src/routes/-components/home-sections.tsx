import { Link } from "@tanstack/react-router"

import { Button } from "@ui/button"
import { Skeleton } from "@ui/skeleton"

export type LandingStats = {
    readonly totalRestaurants: number
    readonly totalWants: number
    readonly topCuisines: ReadonlyArray<{ readonly cuisine: string; readonly count: number }>
    readonly recentAdds: ReadonlyArray<{ readonly name: string; readonly cuisine: string; readonly createdAt: number }>
}

export function LandingEyebrow() {
    return <p className="text-xs font-bold tracking-widest text-primary uppercase">Shared by friends, not algorithms</p>
}

export function LandingActions() {
    return (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button render={<Link to="/signup" />} size="lg">
                Get Started
            </Button>
            <Button render={<Link to="/login" />} tone="secondary" size="lg">
                Sign In
            </Button>
        </div>
    )
}

export function CommunityStatsSkeleton() {
    return (
        <section
            aria-busy="true"
            aria-label="Community activity"
            className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-6 lg:px-12"
        >
            <Skeleton className="mx-auto h-8 w-56" />
            <Skeleton className="mx-auto mt-2 h-4 w-72" />
            <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-card border border-border bg-surface">
                {[0, 1, 2].map((index) => (
                    <div key={index} className="px-4 py-5">
                        <Skeleton className="mx-auto h-9 w-16" />
                        <Skeleton className="mx-auto mt-2 h-4 w-20" />
                    </div>
                ))}
            </div>
        </section>
    )
}

export function CommunityStats({ stats }: Readonly<{ stats: LandingStats }>) {
    const topCuisine = stats.topCuisines[0]
    const statEntries = [
        { value: String(stats.totalRestaurants), label: "restaurants shared" },
        { value: String(stats.totalWants), label: "wants saved" },
        { value: topCuisine?.cuisine ?? "—", label: "top cuisine" },
    ]
    return (
        <section aria-label="Community activity" className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-6 lg:px-12">
            <h2 className="text-center font-display text-2xl font-semibold text-balance text-foreground">
                The short list keeps growing
            </h2>
            <p className="mt-2 text-center text-muted-foreground">Live counts from friends sharing right now.</p>
            <dl className="mt-6 grid grid-cols-3 divide-x divide-border rounded-card border border-border bg-surface">
                {statEntries.map((entry) => (
                    <div key={entry.label} className="flex flex-col px-4 py-5 text-center">
                        <dt className="order-2 mt-1 text-sm text-muted-foreground">{entry.label}</dt>
                        <dd className="order-1 font-display text-3xl font-semibold text-balance text-foreground tabular-nums sm:text-4xl">
                            {entry.value}
                        </dd>
                    </div>
                ))}
            </dl>
            {stats.recentAdds.length > 0 && (
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Fresh on the list:{" "}
                    {stats.recentAdds.map((recent) => `${recent.name} (${recent.cuisine})`).join(" · ")}
                </p>
            )}
        </section>
    )
}

const steps = [
    {
        title: "Add restaurants",
        body: "Save the restaurants your group keeps naming in the chat.",
    },
    {
        title: "Vote want-to-go",
        body: "Heart the ones you would actually show up for.",
    },
    {
        title: "Pick the next bite",
        body: "Open the list, see the overlap, stop debating dinner.",
    },
]

export function HowItWorks() {
    return (
        <section aria-label="How it works" className="mx-auto w-full max-w-5xl px-4 pt-12 pb-4 sm:px-6 lg:px-12">
            <h2 className="text-center font-display text-2xl font-semibold text-balance text-foreground">
                How it works
            </h2>
            <p className="mt-2 text-center text-muted-foreground">Three steps between group chat chaos and a table.</p>
            <ol className="mx-auto mt-8 grid max-w-3xl gap-8 sm:grid-cols-3 sm:gap-6">
                {steps.map((step, index) => (
                    <li key={step.title} className="border-t-2 border-primary pt-4">
                        <p className="font-display text-4xl font-semibold text-primary tabular-nums">{index + 1}</p>
                        <p className="mt-2 font-display text-lg font-semibold text-balance text-foreground">
                            {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </li>
                ))}
            </ol>
        </section>
    )
}

export function LandingCloser() {
    return (
        <section aria-label="Get started" className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-display text-3xl font-semibold text-balance text-foreground sm:text-4xl">
                Stop debating dinner in the chat.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                Bring your people, build the short list, and always know where to go next.
            </p>
            <div className="mt-6 flex justify-center">
                <LandingActions />
            </div>
        </section>
    )
}
