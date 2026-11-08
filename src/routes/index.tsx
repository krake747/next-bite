import { PlusIcon } from "@phosphor-icons/react"
import { createFileRoute } from "@tanstack/react-router"
import { Suspense, useState } from "react"

import { useSuspenseConvexQuery } from "@api/convex.context"
import { convexQueryOptions, warmQueries } from "@api/convex.options"
import { api } from "@api/endpoints"
import { useFeedRestaurants, useRestaurants, type Restaurant } from "@core/restaurants"
import { useAuth } from "@core/session"
import { feedTextFor, orderFeedByRecency } from "@core/social"
import { useFilterState } from "@core/use.filter"
import { useOpenAddRestaurant } from "@features/restaurants/add-restaurant-provider"
import { RestaurantCardSkeleton } from "@features/restaurants/restaurant-card-skeleton"
import { RestaurantList } from "@features/restaurants/restaurant-list"
import { ActivityPost } from "@features/social/activity-post"
import { FriendsFilter } from "@features/social/friends-filter"
import { FriendsFilterSkeleton } from "@features/social/friends-filter"
import { EmptyState } from "@pattern/empty-state"
import {
    CommunityStats,
    CommunityStatsSkeleton,
    HowItWorks,
    LandingActions,
    LandingCloser,
    LandingEyebrow,
} from "@routes/-components/home-sections"
import { SocialActionsProvider, useSocialActions } from "@routes/-components/social-actions-provider"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { BackgroundLayers } from "@ui/background-decoration"
import { Button } from "@ui/button"
import { HeaderBadge } from "@ui/header"

export const Route = createFileRoute("/")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    component: Home,
    loader: ({ context }) => {
        // Public landing stats warm for everyone; the authenticated feed below
        // rides live collections with their own preload, not this cache.
        warmQueries(context.queryClient, [convexQueryOptions(api.landing.getStats)])
        return null
    },
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

function HomeFeed({ feed }: Readonly<{ feed: ReadonlyArray<Restaurant> }>) {
    const actions = useSocialActions()
    return (
        <section aria-label="Latest from friends">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Latest from friends</h2>
            <p className="mt-1 text-muted-foreground">Fresh saves from your people.</p>
            {feed.length === 0 ? (
                <EmptyState
                    title="No friend saves yet"
                    body="When friends share restaurants with you, their latest saves land here."
                    className="mt-6"
                />
            ) : (
                <div className="space-y-6 pt-6">
                    {feed.map((restaurant) => {
                        const social = actions.socialFor(restaurant)
                        return (
                            <ActivityPost
                                key={restaurant._id}
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
                    })}
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

function LandingHero() {
    return (
        <section aria-label="Welcome" className="relative overflow-hidden border-b border-border bg-background">
            <BackgroundLayers />
            <div className="relative mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:py-24">
                <LandingEyebrow />
                <h1 className="mt-6 font-display text-5xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-6xl lg:text-7xl">
                    Your friends have good taste
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-pretty text-muted-foreground">
                    Next Bite is the short list of restaurants your people actually want to try. Save restaurants, vote
                    want-to-go, and pick the next dinner in minutes.
                </p>
                <LandingActions />
                <p className="mt-4 text-sm text-muted-foreground">
                    Free to start · No public reviews · Your list stays yours
                </p>
            </div>
        </section>
    )
}

function LandingStatsSection() {
    const stats = useSuspenseConvexQuery(api.landing.getStats)
    if (stats.totalRestaurants === 0) {
        return null
    }
    return <CommunityStats stats={stats} />
}

function SignedOutHome() {
    return (
        <PageLayout>
            <LandingHero />
            <PageContainer>
                <Suspense fallback={<CommunityStatsSkeleton />}>
                    <LandingStatsSection />
                </Suspense>
                <HowItWorks />
                <LandingCloser />
            </PageContainer>
        </PageLayout>
    )
}

function Home() {
    const restaurants = useRestaurants()
    const feedRestaurants = useFeedRestaurants()
    const auth = useAuth()
    const restaurantListState = restaurants ?? []
    const feed = orderFeedByRecency(feedRestaurants ?? [])

    if (!auth.isAuthenticated) {
        return <SignedOutHome />
    }

    return (
        <PageLayout>
            <PageContainer>
                <HomeHeader name={auth.user?.name?.split(" ")[0] ?? "food lover"} count={restaurantListState.length} />
                {restaurants === undefined || feedRestaurants === undefined ? (
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
                ) : feed.length === 0 && restaurantListState.length === 0 ? (
                    <SocialActionsProvider restaurants={[]}>
                        <div className="mx-auto w-full max-w-xl pt-6">
                            <HomeDiscover restaurants={restaurantListState} />
                        </div>
                    </SocialActionsProvider>
                ) : (
                    <SocialActionsProvider restaurants={[...feed, ...restaurantListState]}>
                        <div className="grid gap-12 pt-10 lg:grid-cols-5 lg:gap-12">
                            <div className="min-w-0 lg:col-span-2">
                                <HomeFeed feed={feed} />
                            </div>
                            <div className="min-w-0 lg:col-span-3">
                                <HomeDiscover restaurants={restaurantListState} />
                            </div>
                        </div>
                    </SocialActionsProvider>
                )}
            </PageContainer>
        </PageLayout>
    )
}
