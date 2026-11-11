import { PlusIcon } from "@phosphor-icons/react"
import { createFileRoute } from "@tanstack/react-router"

import { preloadHomeCollections, useFeedRestaurants, useRestaurants, type Restaurant } from "@core/restaurants"
import { useAuth, useSessionStatus, useViewer } from "@core/session"
import { orderFeedByRecency } from "@core/social"
import { RestaurantCard } from "@features/restaurants/restaurant-card"
import { RestaurantList } from "@features/restaurants/restaurant-list"
import { ActivityPost } from "@features/social/activity-post"
import { ButtonLink } from "@pattern/button-link"
import { EmptyState } from "@pattern/empty-state"
import { HeaderBadge } from "@pattern/header"
import { QueryErrorState } from "@pattern/query-error"
import { HomeSkeleton } from "@routes/-components/page-skeletons"
import { SessionGate } from "@routes/-components/session-gate"
import { SocialActionsProvider, useSocialActions } from "@routes/-components/social-actions-provider"
import { PageContainer } from "@routes/-layouts/page-container"

export const Route = createFileRoute("/_app/home")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    loader: ({ context }) => {
        preloadHomeCollections(context.queryClient)
    },
    component: HomePage,
    errorComponent: HomeError,
})

function HomeError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageContainer>
            <QueryErrorState reset={reset} />
        </PageContainer>
    )
}

function RiverOwnItem({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const actions = useSocialActions()
    return <RestaurantCard restaurant={restaurant} {...actions.cardFor(restaurant)} />
}

function RiverFriendItem({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const actions = useSocialActions()
    return <ActivityPost restaurant={restaurant} {...actions.activityFor(restaurant)} />
}

function HomeRiver({ mine, feed }: Readonly<{ mine: ReadonlyArray<Restaurant>; feed: ReadonlyArray<Restaurant> }>) {
    const viewer = useViewer()
    const ownId = viewer.kind === "signed-in" ? viewer.id : undefined
    const mineIds = new Set(mine.map((restaurant) => restaurant._id))
    const feedOnly = feed.filter((restaurant) => !mineIds.has(restaurant._id))
    const items = [...mine, ...feedOnly].toSorted((a, b) => b._creationTime - a._creationTime)
    const hasAnything = mine.length > 0 || feedOnly.length > 0

    if (!hasAnything) {
        return <HomeDiscover restaurants={[]} />
    }
    return (
        <section aria-label="Latest activity">
            {feedOnly.length === 0 && (
                <EmptyState
                    title="No friend saves yet"
                    body="When friends share restaurants with you, their latest saves land here. Yours are already flowing below."
                    className="mt-6"
                />
            )}
            <div className="flex flex-col gap-6 pt-6">
                {items.map((restaurant) =>
                    restaurant.ownerId === ownId ? (
                        <RiverOwnItem key={restaurant._id} restaurant={restaurant} />
                    ) : (
                        <RiverFriendItem key={restaurant._id} restaurant={restaurant} />
                    ),
                )}
            </div>
        </section>
    )
}

function HomeDiscover({ restaurants }: Readonly<{ restaurants: ReadonlyArray<Restaurant> }>) {
    const actions = useSocialActions()
    return (
        <section aria-label="Saved restaurants">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Saved restaurants</h2>
            <p className="mt-1 text-muted-foreground">Every restaurant on your short list.</p>
            <RestaurantList
                restaurants={restaurants}
                socialFor={actions.socialFor}
                onToggleWant={(restaurant) => {
                    actions.toggleWantFor(restaurant)()
                }}
                detailsHrefFor={(restaurant) => `/restaurants/${restaurant._id}`}
            />
        </section>
    )
}

function HomeHeader({ name, count }: Readonly<{ name: string; count: number }>) {
    return (
        <section aria-label="Welcome back" className="pt-8 sm:pt-10">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                Pick your next table, {name}.
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">Your friends&apos; latest saves, newest first.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
                <ButtonLink to="/add">
                    <PlusIcon className="size-4" />
                    Add Restaurant
                </ButtonLink>
                {count > 0 && <HeaderBadge count={count} />}
            </div>
        </section>
    )
}

function HomeContent() {
    const restaurants = useRestaurants()
    const feedRestaurants = useFeedRestaurants()
    const auth = useAuth()
    const restaurantListState = restaurants ?? []
    const feed = orderFeedByRecency(feedRestaurants ?? [])

    if (restaurants === undefined || feedRestaurants === undefined) {
        return <HomeSkeleton />
    }
    return (
        <div className="mx-auto w-full max-w-3xl">
            <HomeHeader name={auth.user?.name?.split(" ")[0] ?? "food lover"} count={restaurantListState.length} />
            <SocialActionsProvider restaurants={[...feed, ...restaurantListState]}>
                <div className="pt-8">
                    <HomeRiver mine={restaurantListState} feed={feed} />
                </div>
            </SocialActionsProvider>
        </div>
    )
}

function HomePage() {
    const status = useSessionStatus()
    return (
        <PageContainer>
            <SessionGate status={status} context="your next bite" fallback={<HomeSkeleton />}>
                <HomeContent />
            </SessionGate>
        </PageContainer>
    )
}
