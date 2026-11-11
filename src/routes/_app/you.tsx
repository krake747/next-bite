import { createFileRoute, Link } from "@tanstack/react-router"

import { useRestaurants, type Restaurant } from "@core/restaurants"
import { orderFeedByRecency } from "@core/saves"
import { useSessionStatus } from "@core/session"
import { Header, HeaderSubtitle, HeaderTitle } from "@pattern/header"
import { QueryErrorState } from "@pattern/query-error"
import { RestaurantListsSkeleton } from "@routes/-components/page-skeletons"
import { SessionGate } from "@routes/-components/session-gate"
import { PageContainer } from "@routes/-layouts/page-container"

export const Route = createFileRoute("/_app/you")({
    head: () => ({ meta: [{ title: "You - Next Bite" }] }),
    component: YouPage,
    errorComponent: YouError,
})

function YouError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageContainer>
            <Header>
                <HeaderTitle>You</HeaderTitle>
                <HeaderSubtitle>Your saved restaurants, wants, and visits.</HeaderSubtitle>
            </Header>
            <QueryErrorState reset={reset} />
        </PageContainer>
    )
}

function RestaurantsSection({
    title,
    restaurants,
    emptyText,
}: Readonly<{ title: string; restaurants: ReadonlyArray<Restaurant>; emptyText: string }>) {
    return (
        <section aria-label={title}>
            <h2 className="px-4 font-display text-2xl font-semibold text-balance text-foreground">
                {title} · {restaurants.length}
            </h2>
            {restaurants.length === 0 ? (
                <p className="px-4 pt-2 text-sm text-muted-foreground">{emptyText}</p>
            ) : (
                <ul className="grid gap-3 pt-4 md:grid-cols-2">
                    {restaurants.map((restaurant) => (
                        <li
                            key={restaurant._id}
                            className="rounded-card border border-border bg-surface p-4 shadow-card"
                        >
                            <Link
                                to="/restaurants/$restaurantId"
                                params={{ restaurantId: restaurant._id }}
                                className="font-display text-lg font-semibold text-balance text-foreground hover:text-primary"
                            >
                                {restaurant.name}
                            </Link>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {restaurant.cuisine !== undefined && restaurant.cuisine !== ""
                                    ? `${restaurant.cuisine} · `
                                    : ""}
                                {restaurant.address.label}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

function YouContent() {
    const restaurants = useRestaurants()

    if (restaurants === undefined) {
        return <RestaurantListsSkeleton />
    }
    const saved = orderFeedByRecency(restaurants)
    const want = saved.filter((r) => r.mySave === "want")
    const been = saved.filter((r) => r.mySave === "been")

    return (
        <div className="flex flex-col gap-8">
            <RestaurantsSection
                title="Saved"
                restaurants={saved}
                emptyText="Nothing saved yet. Add your first restaurant from Home."
            />
            <RestaurantsSection
                title="Want to try"
                restaurants={want}
                emptyText="No wants yet. Tap Want on any restaurant to park it here."
            />
            <RestaurantsSection
                title="Been"
                restaurants={been}
                emptyText="No visits yet. Mark Been on restaurants you tried."
            />
        </div>
    )
}

function YouPage() {
    const status = useSessionStatus()

    return (
        <PageContainer>
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
                <section aria-label="You" className="px-4 pt-8 sm:pt-10">
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                        You
                    </h1>
                </section>
                <SessionGate status={status} context="your lists" fallback={<RestaurantListsSkeleton />}>
                    <YouContent />
                </SessionGate>
            </div>
        </PageContainer>
    )
}
