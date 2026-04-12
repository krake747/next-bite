import { createSignal, createMemo, Show } from "solid-js"
import { createFileRoute, useNavigate } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle, HeaderBadge } from "./-layout/header"
import { PageLayout } from "./-layout/page-layout"
import { PageContainer } from "./-layout/page-container"
import { useRestaurants, useAuth } from "../core/hooks"
import { useFilterState } from "../ui/hooks/use-filter"
import { FriendsFilter } from "../features/friends-filter"
import { RestaurantList } from "../features/restaurants/restaurant-list"
import { AddRestaurantDialog } from "../features/restaurants/add-restaurant-dialog"
import { Button } from "../ui/button"
import { Loading } from "../ui/loading"
import LoaderPinwheel from "lucide-solid/icons/loader-pinwheel"
import Plus from "lucide-solid/icons/plus"

export const Route = createFileRoute("/")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    component: Home,
})

function Home() {
    const navigate = useNavigate()
    const auth = useAuth()
    const restaurants = useRestaurants()
    const [showAddDialog, setShowAddDialog] = createSignal(false)

    const restaurantListState = () => restaurants() ?? []
    const count = createMemo(() => restaurantListState().length)

    const filterState = useFilterState()
    const [sortOrder, setSortOrder] = createSignal<"added" | "name">("added")

    const filteredRestaurants = () => {
        let result = restaurantListState()

        // Filter by friend (addedBy)
        const friendFilter = filterState.filter()
        if (friendFilter) {
            result = result.filter((r) => r.addedBy === friendFilter)
        }

        // Filter by search term (restaurant name)
        const searchTerm = filterState.search().trim().toLowerCase()
        if (searchTerm) {
            result = result.filter((r) => r.name.toLowerCase().includes(searchTerm))
        }

        // Sort
        if (sortOrder() === "name") {
            result = [...result].sort((a, b) => a.name.localeCompare(b.name))
        }

        return result
    }

    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Our next bite</HeaderTitle>
                    <HeaderSubtitle>Places we're dreaming of trying together</HeaderSubtitle>
                    <HeaderBadge count={count()} />
                </Header>
                <Show when={restaurants()} fallback={<Loading message="restaurants" />}>
                    <div class="pt-4">
                        <FriendsFilter
                            filter={filterState.filter()}
                            handleFilter={(name) => filterState.setFilter(name)}
                            search={filterState.search()}
                            handleSearch={(value) => filterState.setSearch(value)}
                            sortOrder={sortOrder()}
                            onSortChange={setSortOrder}
                        >
                            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <Button
                                    onClick={() =>
                                        navigate({ from: Route.fullPath, to: "/wheel", viewTransition: true })
                                    }
                                >
                                    <LoaderPinwheel class="size-4 transition-transform duration-200 group-hover:rotate-90" />
                                    Spin the wheel
                                </Button>
                                <Show when={auth.isAuthenticated()}>
                                    <Button variant="secondary" onClick={() => setShowAddDialog(true)}>
                                        <Plus class="size-4 transition-transform duration-200 group-hover:rotate-90" />
                                        Add Restaurant
                                    </Button>
                                </Show>
                                <Show when={!auth.isAuthenticated()}>
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            navigate({ to: "/login", from: Route.fullPath, viewTransition: true })
                                        }
                                    >
                                        <Plus
                                            class="size-4 transition-transform duration-200 group-hover:rotate-90"
                                            aria-hidden="true"
                                        />
                                        Sign in to add
                                    </Button>
                                </Show>
                            </div>
                        </FriendsFilter>
                    </div>
                    <RestaurantList
                        restaurants={filteredRestaurants}
                        hasFilter={!!filterState.filter()}
                        hasSearch={!!filterState.search()}
                        onAddClick={() => setShowAddDialog(true)}
                        sortOrder={sortOrder()}
                    />
                </Show>
                <Show when={auth.isAuthenticated()}>
                    <AddRestaurantDialog show={showAddDialog()} onOpenChange={setShowAddDialog} />
                </Show>
            </PageContainer>
        </PageLayout>
    )
}
