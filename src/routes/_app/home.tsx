import { PlusIcon } from "@phosphor-icons/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { useFeedRestaurants, useRestaurants, type Restaurant } from "@core/restaurants"
import { useAuth, useSessionStatus } from "@core/session"
import { feedTextFor, orderFeedByRecency } from "@core/social"
import { useFilterState } from "@core/use.filter"
import { useOpenAddRestaurant } from "@features/restaurants/add-restaurant-provider"
import { RestaurantCard } from "@features/restaurants/restaurant-card"
import { RestaurantCardSkeleton } from "@features/restaurants/restaurant-card-skeleton"
import { RestaurantList } from "@features/restaurants/restaurant-list"
import { ActivityPost } from "@features/social/activity-post"
import { FriendsFilter } from "@features/social/friends-filter"
import { FriendsFilterSkeleton } from "@features/social/friends-filter"
import { EmptyState } from "@pattern/empty-state"
import { SessionGate } from "@routes/-components/session-gate"
import { SocialActionsProvider, useSocialActions } from "@routes/-components/social-actions-provider"
import { PageContainer } from "@routes/-layouts/page-container"
import { Button } from "@ui/button"
import { HeaderBadge } from "@ui/header"

export const Route = createFileRoute("/_app/home")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    component: HomePage,
})

function filterRestaurants(
    restaurants: ReadonlyArray<Restaurant>,
    filter: string,
    search: string,
    sortOrder: "added" | "name",
): Restaurant[] {
    let filteredResult = [...restaurants]

    if (filter !== "") {
        filteredResult = filteredResult.filter((r) => r.ownerId === filter)
    }

    const searchTerm = search.trim().toLowerCase()
    if (searchTerm !== "") {
        filteredResult = filteredResult.filter((r) => r.name.toLowerCase().includes(searchTerm))
    }

    if (sortOrder === "name") {
        filteredResult = filteredResult.toSorted((a, b) => a.name.localeCompare(b.name))
    }

    return filteredResult
}

function RiverOwnItem({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const actions = useSocialActions()
    return (
        <RestaurantCard
            restaurant={restaurant}
            social={actions.socialFor(restaurant)}
            onToggleWant={() => {
                actions.toggleWantFor(restaurant)()
            }}
            detailsHref={`/restaurants/${restaurant._id}`}
        />
    )
}

function RiverFriendItem({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const actions = useSocialActions()
    const social = actions.socialFor(restaurant)
    return (
        <ActivityPost
            author={{ name: restaurant.ownerName }}
            time={new Date(restaurant._creationTime).toLocaleDateString()}
            text={feedTextFor(restaurant.name, restaurant.details?.notes)}
            restaurant={restaurant}
            social={{ ...social, ownerName: restaurant.ownerName }}
            reactions={{
                liked: social.liked,
                likeCount: social.likeCount,
                onToggleLike: actions.toggleLikeFor(restaurant),
                commentCount: social.commentCount,
                onComment: () => {
                    actions.goToDetail(restaurant)
                },
                wanted: social.wanted,
                wantCount: social.wantCount,
                onToggleWant: actions.toggleWantFor(restaurant),
            }}
        />
    )
}

function HomeRiver({ mine, feed }: Readonly<{ mine: ReadonlyArray<Restaurant>; feed: ReadonlyArray<Restaurant> }>) {
    const auth = useAuth()
    const [sortOrder, setSortOrder] = useState<"added" | "name">("added")
    const filterState = useFilterState()
    // Friend pills only appear for users actually present across both lists.
    // The filter keys on stable user ids, never on renamable display names.
    const ownId = auth.user?.id
    const mineIds = new Set(mine.map((restaurant) => restaurant._id))
    // The owner and feed collections never share an id in production, but
    // seeded test clients mirror the same rows into both. Render a duplicate
    // once, as your own card with full actions.
    const feedOnly = feed.filter((restaurant) => !mineIds.has(restaurant._id))
    const matchingIds = [...new Set([...mine, ...feedOnly].map((restaurant) => restaurant.ownerId))].filter(
        (id) => id !== ownId,
    )
    const combined = [...mine, ...feedOnly].toSorted((a, b) => b._creationTime - a._creationTime)
    const items = filterRestaurants(combined, filterState.filter, filterState.search, sortOrder)
    const hasAnything = mine.length > 0 || feedOnly.length > 0

    if (!hasAnything) {
        return <HomeDiscover restaurants={[]} />
    }
    return (
        <section aria-label="Latest activity">
            <div className="sticky top-4 z-10 -mx-2 rounded-control bg-background/95 px-2 py-2 backdrop-blur-md">
                <FriendsFilter
                    filter={filterState.filter}
                    handleFilter={(name) => {
                        filterState.setFilter(name)
                    }}
                    search={filterState.search}
                    handleSearch={(value) => {
                        filterState.setSearch(value)
                    }}
                    sortOrder={sortOrder}
                    onSortChange={setSortOrder}
                    matchingIds={matchingIds}
                />
            </div>
            {feedOnly.length === 0 && (
                <EmptyState
                    title="No friend saves yet"
                    body="When friends share restaurants with you, their latest saves land here. Yours are already flowing below."
                    className="mt-6"
                />
            )}
            {items.length === 0 ? (
                <EmptyState
                    title="Nothing matches"
                    body="Try a different search or clear the friend filter."
                    className="mt-6"
                />
            ) : (
                <div className="flex flex-col gap-6 pt-6">
                    {items.map((restaurant) =>
                        restaurant.ownerId === ownId ? (
                            <RiverOwnItem key={restaurant._id} restaurant={restaurant} />
                        ) : (
                            <RiverFriendItem key={restaurant._id} restaurant={restaurant} />
                        ),
                    )}
                </div>
            )}
        </section>
    )
}

function HomeDiscover({ restaurants }: Readonly<{ restaurants: ReadonlyArray<Restaurant> }>) {
    const actions = useSocialActions()
    const auth = useAuth()
    const [sortOrder, setSortOrder] = useState<"added" | "name">("added")
    const filterState = useFilterState()
    const filtered = filterRestaurants(restaurants, filterState.filter, filterState.search, sortOrder)
    // Friend pills only appear for users actually present in this list.
    // Personal saves are owned by the viewer, so no friend pill shows here;
    // the filter keys on stable user ids, never on renamable display names.
    const ownId = auth.user?.id
    const matchingIds = [...new Set(restaurants.map((restaurant) => restaurant.ownerId))].filter((id) => id !== ownId)
    return (
        <section aria-label="Saved restaurants">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Saved restaurants</h2>
            <p className="mt-1 text-muted-foreground">Every restaurant on your short list. Search by craving.</p>
            {restaurants.length > 0 && (
                <div className="pt-4">
                    <FriendsFilter
                        filter={filterState.filter}
                        handleFilter={(name) => {
                            filterState.setFilter(name)
                        }}
                        search={filterState.search}
                        handleSearch={(value) => {
                            filterState.setSearch(value)
                        }}
                        sortOrder={sortOrder}
                        onSortChange={setSortOrder}
                        matchingIds={matchingIds}
                    />
                </div>
            )}
            <RestaurantList
                restaurants={filtered}
                hasFilter={filterState.filter !== ""}
                hasSearch={filterState.search !== ""}
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
    const openAdd = useOpenAddRestaurant()
    return (
        <section aria-label="Welcome back" className="pt-8 sm:pt-10">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                What&apos;s next, {name}?
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
                Your friends&apos; latest saves. Jump back in and pick the next table.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={openAdd}>
                    <PlusIcon className="size-4" />
                    Add Restaurant
                </Button>
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
        return (
            <>
                <div className="pt-4">
                    <FriendsFilterSkeleton />
                </div>
                <div className="grid gap-8 md:grid-cols-2 md:gap-10">
                    <RestaurantCardSkeleton />
                    <RestaurantCardSkeleton />
                    <RestaurantCardSkeleton />
                    <RestaurantCardSkeleton />
                </div>
            </>
        )
    }
    if (feed.length === 0 && restaurantListState.length === 0) {
        return (
            <>
                <HomeHeader name={auth.user?.name?.split(" ")[0] ?? "food lover"} count={restaurantListState.length} />
                <SocialActionsProvider restaurants={[]}>
                    <div className="mx-auto w-full max-w-xl pt-6">
                        <HomeRiver mine={restaurantListState} feed={feed} />
                    </div>
                </SocialActionsProvider>
            </>
        )
    }
    return (
        <>
            <HomeHeader name={auth.user?.name?.split(" ")[0] ?? "food lover"} count={restaurantListState.length} />
            <SocialActionsProvider restaurants={[...feed, ...restaurantListState]}>
                <div className="mx-auto w-full max-w-3xl pt-10">
                    <HomeRiver mine={restaurantListState} feed={feed} />
                </div>
            </SocialActionsProvider>
        </>
    )
}

function HomePage() {
    const status = useSessionStatus()
    return (
        <PageContainer>
            <SessionGate status={status} context="your next bite">
                <HomeContent />
            </SessionGate>
        </PageContainer>
    )
}
