import { PlusIcon } from "@phosphor-icons/react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { useFeedRestaurants, useRestaurants, useAuth, useLandingStats, type Restaurant } from "@core/hooks"
import { feedTextFor, orderFeedByRecency } from "@core/social"
import { useFilterState } from "@core/use-filter"
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
import { Header, HeaderSubtitle, HeaderTitle, HeaderBadge } from "@ui/header"

export const Route = createFileRoute("/")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    component: Home,
})

function filterRestaurants(
    restaurants: ReadonlyArray<Restaurant>,
    filter: string | null,
    search: string,
    sortOrder: "added" | "name",
): Restaurant[] {
    let filteredResult = [...restaurants]

    if (filter !== null && filter !== "") {
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
        <section aria-label="Latest from friends" className="pt-10">
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
    // Friend pills only appear for accounts actually present in this list.
    // Personal saves are owned by the viewer, so no friend pill shows here;
    // the filter keys on stable account ids, never on renamable display names.
    const ownId = auth.user?.id
    const matchingIds = [...new Set(restaurants.map((restaurant) => restaurant.ownerId))].filter((id) => id !== ownId)
    return (
        <section aria-label="Saved places" className="pt-10">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Saved places</h2>
            <p className="mt-1 text-muted-foreground">Every place on your short list. Search by craving.</p>
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
                >
                    <HomeActions />
                </FriendsFilter>
            </div>
            <RestaurantList
                restaurants={filtered}
                hasFilter={filterState.filter !== null && filterState.filter !== ""}
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

function HomeHeaderButton() {
    const openAdd = useOpenAddRestaurant()
    return (
        <Button onClick={openAdd}>
            <PlusIcon className="size-4 transition-transform duration-200 group-hover:rotate-90" />
            Add Restaurant
        </Button>
    )
}

function HomeActions() {
    const navigate = useNavigate()
    const auth = useAuth()
    const openAdd = useOpenAddRestaurant()
    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {auth.isAuthenticated ? (
                <Button tone="secondary" onClick={openAdd}>
                    <PlusIcon className="size-4 transition-transform duration-200 group-hover:rotate-90" />
                    Add Restaurant
                </Button>
            ) : (
                <Button
                    tone="secondary"
                    onClick={() => {
                        void navigate({ to: "/login", viewTransition: true })
                    }}
                >
                    <PlusIcon className="size-4 transition-transform duration-200 group-hover:rotate-90" />
                    Sign in to add
                </Button>
            )}
        </div>
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
                    Next Bite is the short list of places your people actually want to try. Save spots, vote want-to-go,
                    and pick the next dinner in minutes.
                </p>
                <LandingActions />
                <p className="mt-4 text-sm text-muted-foreground">
                    Free to start · No public reviews · Your list stays yours
                </p>
            </div>
        </section>
    )
}

function SignedOutHome() {
    const stats = useLandingStats()
    return (
        <PageLayout>
            <LandingHero />
            <PageContainer>
                {stats === undefined ? (
                    <CommunityStatsSkeleton />
                ) : stats.totalRestaurants === 0 ? null : (
                    <CommunityStats stats={stats} />
                )}
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
                <Header>
                    <HeaderTitle>What&apos;s next, {auth.user?.name?.split(" ")[0] ?? "food lover"}?</HeaderTitle>
                    <HeaderSubtitle>
                        Your crew&apos;s latest saves. Jump back in and pick the next table.
                    </HeaderSubtitle>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <HomeHeaderButton />
                        <HeaderBadge count={restaurantListState.length} />
                    </div>
                </Header>
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
                ) : (
                    <SocialActionsProvider restaurants={[...feed, ...restaurantListState]}>
                        <div className="grid lg:grid-cols-5 lg:gap-12">
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
