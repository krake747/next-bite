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

    const filteredRestaurants = () => {
        return filterState.filtered(restaurantListState(), (r) => r.name)
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
                        >
                            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <Button
                                    onClick={() =>
                                        navigate({ from: Route.fullPath, to: "/wheel", viewTransition: true })
                                    }
                                >
                                    <LoaderPinwheel class="size-4" />
                                    Spin the wheel
                                </Button>
                                <Show when={auth.isAuthenticated()}>
                                    <Button variant="secondary" onClick={() => setShowAddDialog(true)}>
                                        <Plus class="size-4" />
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
                                        <Plus class="size-4" aria-hidden="true" />
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
                    />
                </Show>
                <Show when={auth.isAuthenticated()}>
                    <AddRestaurantDialog show={showAddDialog()} onOpenChange={setShowAddDialog} />
                </Show>
            </PageContainer>
        </PageLayout>
    )
}
