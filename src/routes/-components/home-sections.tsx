import { Link } from "@tanstack/react-router"
import Heart from "lucide-react/icons/heart"
import MapPin from "lucide-react/icons/map-pin"
import Users from "lucide-react/icons/users"

import { Button } from "@ui/button"

export type LandingStats = {
    readonly totalRestaurants: number
    readonly totalWants: number
    readonly topCuisines: ReadonlyArray<{ readonly cuisine: string; readonly count: number }>
    readonly recentAdds: ReadonlyArray<{ readonly name: string; readonly cuisine: string; readonly createdAt: number }>
}

export function LandingEyebrow({ totalRestaurants }: Readonly<{ totalRestaurants: number | undefined }>) {
    return (
        <p className="inline-flex items-center gap-2 rounded-full bg-surface/80 py-1 pr-4 pl-1 text-sm font-semibold text-stone-700 shadow-card ring-1 ring-border backdrop-blur-sm">
            <span className="flex size-8 items-center justify-center rounded-full bg-linear-to-br from-tomato-500 to-tomato-600 text-white tabular-nums shadow-inner">
                {totalRestaurants ?? "·"}
            </span>
            Shared by friends, not algorithms
        </p>
    )
}

export function LandingActions() {
    return (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button render={<Link to="/signup" viewTransition />} size="lg">
                Get Started
            </Button>
            <Button render={<Link to="/login" viewTransition />} variant="secondary" size="lg">
                Sign In
            </Button>
        </div>
    )
}

export function CommunityStats({ stats }: Readonly<{ stats: LandingStats }>) {
    const topCuisine = stats.topCuisines[0]
    const cards = [
        { value: String(stats.totalRestaurants), label: "places shared" },
        { value: String(stats.totalWants), label: "wants saved" },
        { value: topCuisine?.cuisine ?? "—", label: "top cuisine" },
    ]
    return (
        <section aria-label="Community activity" className="mx-auto w-full max-w-5xl px-4 pt-12 sm:px-6 lg:px-12">
            <div className="grid gap-4 sm:grid-cols-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="rounded-card border border-border bg-surface p-6 text-center shadow-card"
                    >
                        <p className="font-display text-4xl font-semibold text-balance text-stone-900">{card.value}</p>
                        <p className="mt-1 text-sm text-stone-600">{card.label}</p>
                    </div>
                ))}
            </div>
            {stats.recentAdds.length === 0 ? null : (
                <ul className="mx-auto mt-8 max-w-md space-y-2 text-center">
                    {stats.recentAdds.map((place) => (
                        <li key={`${place.name}-${place.createdAt}`} className="text-sm text-stone-600">
                            {place.name} · {place.cuisine}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

const steps = [
    {
        icon: MapPin,
        title: "Add places",
        body: "Save the spots your group keeps naming in the chat.",
    },
    {
        icon: Heart,
        title: "Vote want-to-go",
        body: "Heart the ones you would actually show up for.",
    },
    {
        icon: Users,
        title: "Pick the next bite",
        body: "Open the list, see the overlap, stop debating dinner.",
    },
]

export function HowItWorks() {
    return (
        <section aria-label="How it works" className="mx-auto w-full max-w-5xl px-4 pt-12 pb-4 sm:px-6 lg:px-12">
            <h2 className="text-center font-display text-2xl font-semibold text-balance text-stone-900">
                How it works
            </h2>
            <p className="mt-2 text-center text-stone-600">Three steps between group chat chaos and a table.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {steps.map((step, index) => (
                    <div key={step.title} className="rounded-card border border-border bg-surface p-6 shadow-card">
                        <div className="flex items-center gap-3">
                            <span className="flex size-9 items-center justify-center rounded-full bg-tomato-100 text-tomato-600">
                                <step.icon className="size-4" aria-hidden="true" />
                            </span>
                            <span className="text-xs font-semibold tracking-widest text-stone-500 uppercase">
                                Step {index + 1}
                            </span>
                        </div>
                        <p className="mt-3 font-display text-lg font-semibold text-balance text-stone-900">
                            {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-stone-600">{step.body}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}

export function LandingCloser() {
    return (
        <section aria-label="Get started" className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-display text-3xl font-semibold text-balance text-stone-900 sm:text-4xl">
                Stop scrolling. Start eating.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-stone-600">
                Bring your people, build the short list, and always know where to go next.
            </p>
            <div className="mt-6 flex justify-center">
                <LandingActions />
            </div>
        </section>
    )
}
