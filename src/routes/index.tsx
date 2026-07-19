import { createFileRoute, useNavigate } from "@tanstack/react-router"
import LoaderPinwheel from "lucide-react/icons/loader-pinwheel"
import Plus from "lucide-react/icons/plus"
import { useState } from "react"

import { useRestaurants, useAuth } from "@core/hooks"
import { FriendsFilter } from "@features/friends-filter"
import { FriendsFilterSkeleton } from "@features/friends-filter"
import { AddRestaurantDialog } from "@features/restaurants/add-restaurant-dialog"
import { RestaurantCardSkeleton } from "@features/restaurants/restaurant-card-skeleton"
import { RestaurantList } from "@features/restaurants/restaurant-list"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { Header, HeaderSubtitle, HeaderTitle, HeaderBadge } from "@ui/header"
import { useFilterState } from "@ui/hooks/use-filter"

export const Route = createFileRoute("/")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    component: Home,
})

function Home() {
    const navigate = useNavigate()
    const auth = useAuth()
    const restaurants = useRestaurants()
    const [showAddDialog, setShowAddDialog] = useState(false)

    const restaurantListState = restaurants ?? []
    const count = restaurantListState.length

    const filterState = useFilterState()
    const [sortOrder, setSortOrder] = useState<"added" | "name">("added")

    let filteredResult = restaurantListState

    if (filterState.filter) {
        filteredResult = filteredResult.filter((r) => r.addedBy === filterState.filter)
    }

    const searchTerm = filterState.search.trim().toLowerCase()
    if (searchTerm) {
        filteredResult = filteredResult.filter((r) => r.name.toLowerCase().includes(searchTerm))
    }

    if (sortOrder === "name") {
        filteredResult = [...filteredResult].sort((a, b) => a.name.localeCompare(b.name))
    }

    const filteredRestaurants = filteredResult

    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Our next bite</HeaderTitle>
                    <HeaderSubtitle>Places we're dreaming of trying together</HeaderSubtitle>
                    <HeaderBadge count={count} />
                </Header>
                {!restaurants ? (
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
                        <div className="pt-4">
                            <FriendsFilter
                                filter={filterState.filter}
                                handleFilter={(name) => filterState.setFilter(name)}
                                search={filterState.search}
                                handleSearch={(value) => filterState.setSearch(value)}
                                sortOrder={sortOrder}
                                onSortChange={setSortOrder}
                            >
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <Button
                                        onClick={() =>
                                            navigate({ from: Route.fullPath, to: "/wheel", viewTransition: true })
                                        }
                                    >
                                        <LoaderPinwheel className="size-4 transition-transform duration-200 group-hover:rotate-90" />
                                        Spin the wheel
                                    </Button>
                                    {auth.isAuthenticated ? (
                                        <Button variant="secondary" onClick={() => setShowAddDialog(true)}>
                                            <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
                                            Add Restaurant
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                navigate({ to: "/login", from: Route.fullPath, viewTransition: true })
                                            }
                                        >
                                            <Plus
                                                className="size-4 transition-transform duration-200 group-hover:rotate-90"
                                                aria-hidden="true"
                                            />
                                            Sign in to add
                                        </Button>
                                    )}
                                </div>
                            </FriendsFilter>
                        </div>
                        <RestaurantList
                            restaurants={filteredRestaurants}
                            hasFilter={!!filterState.filter}
                            hasSearch={!!filterState.search}
                            onAddClick={() => setShowAddDialog(true)}
                            sortOrder={sortOrder}
                        />
                    </>
                )}
                {auth.isAuthenticated && <AddRestaurantDialog show={showAddDialog} onOpenChange={setShowAddDialog} />}
            </PageContainer>
        </PageLayout>
    )
}
