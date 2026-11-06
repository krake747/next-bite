import { createFileRoute, useNavigate } from "@tanstack/react-router"
import Plus from "lucide-react/icons/plus"
import { useState } from "react"

import { useFeedRestaurants, useRestaurants, useAuth, useLandingStats, type Restaurant } from "@core/hooks"
import {
    emptySocialSummary,
    feedTextFor,
    orderFeedByRecency,
    useSocialSummaries,
    useToggleInterest,
    useToggleLike,
    type RestaurantSocialSummary,
} from "@core/social"
import { useFilterState } from "@core/use-filter"
import { FriendsFilter } from "@features/friends-filter"
import { FriendsFilterSkeleton } from "@features/friends-filter"
import { AddRestaurantDialog } from "@features/restaurants/add-restaurant-dialog"
import { RestaurantCardSkeleton } from "@features/restaurants/restaurant-card-skeleton"
import { RestaurantList } from "@features/restaurants/restaurant-list"
import { ActivityPost } from "@features/social/activity-post"
import { EmptyState } from "@pattern/empty-state"
import {
    CommunityStats,
    CommunityStatsSkeleton,
    HowItWorks,
    LandingActions,
    LandingCloser,
    LandingEyebrow,
} from "@routes/-components/home-sections"
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
        filteredResult = filteredResult.filter((r) => r.ownerName === filter)
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

function useSocialActions(restaurants: ReadonlyArray<Restaurant> | undefined) {
    const navigate = useNavigate()
    const auth = useAuth()
    const summaries = useSocialSummaries(restaurants === undefined ? [] : restaurants.map((r) => r._id))
    const toggleInterest = useToggleInterest()
    const toggleLike = useToggleLike()

    const goToLogin = () => {
        void navigate({ to: "/login", viewTransition: true })
    }

    const goToDetail = (restaurant: Restaurant) => {
        void navigate({
            to: "/restaurants/$restaurantId",
            params: { restaurantId: restaurant._id },
            viewTransition: true,
        })
    }

    const socialFor = (restaurant: Restaurant): RestaurantSocialSummary =>
        summaries?.get(restaurant._id) ?? emptySocialSummary

    const toggleWantFor = (restaurant: Restaurant) => () => {
        if (!auth.isAuthenticated) {
            goToLogin()
            return
        }
        toggleInterest.mutate({ restaurantId: restaurant._id, status: "want" })
    }

    const toggleLikeFor = (restaurant: Restaurant) => () => {
        if (!auth.isAuthenticated) {
            goToLogin()
            return
        }
        toggleLike.mutate({ restaurantId: restaurant._id })
    }

    return { auth, summaries, socialFor, toggleWantFor, toggleLikeFor, goToDetail, goToLogin }
}

type SocialActions = ReturnType<typeof useSocialActions>

function HomeFeed({
    feed,
    actions,
}: Readonly<{
    feed: ReadonlyArray<Restaurant>
    actions: SocialActions
}>) {
    return (
        <section aria-label="Latest activity" className="pt-10">
            <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">Latest activity</h2>
            <p className="mt-1 text-stone-600">Fresh saves and shouts from your people.</p>
            {feed.length === 0 ? (
                <EmptyState
                    title="No crew activity yet"
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

function HomeDiscover({
    restaurants,
    sortOrder,
    onSortChange,
    onAddClick,
    actions,
}: Readonly<{
    restaurants: ReadonlyArray<Restaurant>
    sortOrder: "added" | "name"
    onSortChange: (order: "added" | "name") => void
    onAddClick: () => void
    actions: SocialActions
}>) {
    const filterState = useFilterState()
    const filtered = filterRestaurants(restaurants, filterState.filter, filterState.search, sortOrder)
    return (
        <section aria-label="Discover" className="pt-10">
            <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">Discover</h2>
            <p className="mt-1 text-stone-600">Every place on the short list. Filter by friend, search by craving.</p>
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
                    onSortChange={onSortChange}
                >
                    <HomeActions onAddClick={onAddClick} />
                </FriendsFilter>
            </div>
            <RestaurantList
                restaurants={filtered}
                hasFilter={filterState.filter !== null && filterState.filter !== ""}
                hasSearch={filterState.search !== ""}
                onAddClick={onAddClick}
                socialFor={actions.socialFor}
                onToggleWant={(restaurant) => {
                    actions.toggleWantFor(restaurant)()
                }}
                detailsHrefFor={(restaurant) => `/restaurants/${restaurant._id}`}
            />
        </section>
    )
}

function HomeActions({ onAddClick }: Readonly<{ onAddClick: () => void }>) {
    const navigate = useNavigate()
    const auth = useAuth()
    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {auth.isAuthenticated ? (
                <Button tone="secondary" onClick={onAddClick}>
                    <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
                    Add Restaurant
                </Button>
            ) : (
                <Button
                    tone="secondary"
                    onClick={() => {
                        void navigate({ to: "/login", viewTransition: true })
                    }}
                >
                    <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
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
                <h1 className="mt-6 font-display text-5xl leading-tight font-semibold tracking-tight text-balance text-stone-900 sm:text-6xl lg:text-7xl">
                    Your friends have good taste
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-pretty text-stone-600">
                    Next Bite is the short list of places your people actually want to try. Save spots, vote want-to-go,
                    and pick the next dinner in minutes.
                </p>
                <LandingActions />
                <p className="mt-4 text-sm text-stone-600">Free to start · No public reviews · Your list stays yours</p>
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
    const restaurantListState = restaurants ?? []
    const feed = orderFeedByRecency(feedRestaurants ?? [])
    const actions = useSocialActions([...feed, ...restaurantListState])
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [sortOrder, setSortOrder] = useState<"added" | "name">("added")

    if (!actions.auth.isAuthenticated) {
        return <SignedOutHome />
    }

    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>
                        What&apos;s next, {actions.auth.user?.name?.split(" ")[0] ?? "food lover"}?
                    </HeaderTitle>
                    <HeaderSubtitle>
                        Your crew&apos;s latest saves, wants, and shouts. Jump back in and pick the next table.
                    </HeaderSubtitle>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Button
                            onClick={() => {
                                setShowAddDialog(true)
                            }}
                        >
                            <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
                            Add Restaurant
                        </Button>
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
                    <>
                        <HomeFeed feed={feed} actions={actions} />
                        <HomeDiscover
                            restaurants={restaurantListState}
                            sortOrder={sortOrder}
                            onSortChange={setSortOrder}
                            onAddClick={() => {
                                setShowAddDialog(true)
                            }}
                            actions={actions}
                        />
                    </>
                )}
                {actions.auth.isAuthenticated && (
                    <AddRestaurantDialog show={showAddDialog} onOpenChange={setShowAddDialog} />
                )}
            </PageContainer>
        </PageLayout>
    )
}
