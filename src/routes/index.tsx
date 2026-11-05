import { createFileRoute, useNavigate } from "@tanstack/react-router"
import Plus from "lucide-react/icons/plus"
import { useState } from "react"

import { useRestaurants, useAuth, type Restaurant } from "@core/hooks"
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
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
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
        filteredResult = filteredResult.filter((r) => r.addedBy === filter)
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
        <div className="space-y-6 pt-4">
            {feed.map((restaurant) => {
                const social = actions.socialFor(restaurant)
                return (
                    <ActivityPost
                        key={restaurant._id}
                        author={{ name: restaurant.addedBy }}
                        time={new Date(restaurant._creationTime).toLocaleDateString()}
                        text={feedTextFor(restaurant.name, restaurant.notes)}
                        restaurantName={restaurant.name}
                        restaurantCuisine={restaurant.cuisine}
                        photoUrls={(restaurant.images ?? []).map((img) => img.url)}
                        addedBy={restaurant.addedBy}
                        wantCount={social.wantCount}
                        beenCount={social.beenCount}
                        interestedFriends={social.interestedNames.map((name) => ({ name }))}
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
        <>
            <div className="pt-10">
                <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">Discover</h2>
            </div>
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
                sortOrder={sortOrder}
                socialFor={actions.socialFor}
                onToggleWant={(restaurant) => {
                    actions.toggleWantFor(restaurant)()
                }}
                detailsHrefFor={(restaurant) => `/restaurants/${restaurant._id}`}
            />
        </>
    )
}

function HomeActions({ onAddClick }: Readonly<{ onAddClick: () => void }>) {
    const navigate = useNavigate()
    const auth = useAuth()
    return (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {auth.isAuthenticated ? (
                <Button variant="secondary" onClick={onAddClick}>
                    <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
                    Add Restaurant
                </Button>
            ) : (
                <Button
                    variant="secondary"
                    onClick={() => {
                        void navigate({ to: "/login", viewTransition: true })
                    }}
                >
                    <Plus
                        className="size-4 transition-transform duration-200 group-hover:rotate-90"
                        aria-hidden="true"
                    />
                    Sign in to add
                </Button>
            )}
        </div>
    )
}

function Home() {
    const restaurants = useRestaurants()
    const actions = useSocialActions(restaurants)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [sortOrder, setSortOrder] = useState<"added" | "name">("added")

    const restaurantListState = restaurants ?? []
    const feed = orderFeedByRecency(restaurantListState)

    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Your friends have good taste</HeaderTitle>
                    <HeaderSubtitle>See what&apos;s new and find your next place to eat</HeaderSubtitle>
                    <HeaderBadge count={restaurantListState.length} />
                </Header>
                {restaurants === undefined ? (
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
