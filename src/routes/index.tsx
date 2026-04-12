import { For, createSignal, createMemo, Show } from "solid-js"
import { createFileRoute, useNavigate } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle, HeaderBadge } from "../features/header"
import { PageLayout } from "../features/page-layout"
import { useRestaurants, useAuth } from "../core/hooks"
import { RestaurantCard } from "../features/restaurant-card"
import { FriendsFilter } from "../features/friends-filter"
import { AddRestaurantDialog } from "../features/add-restaurant-dialog"
import { EmptyRestaurantsState } from "../features/empty-restaurants-state"
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

    const [filter, setFilter] = createSignal<string | null>(null)
    const [search, setSearch] = createSignal("")
    const [show, setShow] = createSignal(false)

    const restaurants = useRestaurants()

    const filteredRestaurants = createMemo(() => {
        const r = restaurants()
        if (!r) return []
        let result = filter() ? r.filter((x) => x.addedBy === filter()) : r
        const searchTerm = search().trim().toLowerCase()
        if (searchTerm) {
            result = result.filter((x) => x.name.toLowerCase().includes(searchTerm))
        }
        return result
    })

    const count = createMemo(() => filteredRestaurants().length)

    return (
        <PageLayout>
            <div class="container mx-auto max-w-7xl px-4 pt-6 pb-8">
                <Header>
                    <HeaderTitle>Our next bite</HeaderTitle>
                    <HeaderSubtitle>Places we're dreaming of trying together</HeaderSubtitle>
                    <HeaderBadge count={count()} />
                </Header>
                <Show when={restaurants()} fallback={<Loading message="restaurants" />}>
                    <div class="pt-4">
                        <FriendsFilter
                            filter={filter()}
                            handleFilter={setFilter}
                            search={search()}
                            handleSearch={setSearch}
                        >
                            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                <Button onClick={() => navigate({ from: Route.fullPath, to: "/wheel" })}>
                                    <LoaderPinwheel class="size-4" />
                                    Spin the wheel
                                </Button>
                                <Show when={auth.isAuthenticated()}>
                                    <Button variant="secondary" onClick={() => setShow(true)}>
                                        <Plus class="size-4" />
                                        Add Restaurant
                                    </Button>
                                </Show>
                                <Show when={!auth.isAuthenticated()}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => navigate({ to: "/login", from: Route.fullPath })}
                                    >
                                        <Plus class="size-4" aria-hidden="true" />
                                        Sign in to add
                                    </Button>
                                </Show>
                            </div>
                        </FriendsFilter>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        <For
                            each={filteredRestaurants()}
                            fallback={
                                <EmptyRestaurantsState
                                    hasFilter={!!filter()}
                                    hasSearch={!!search().trim()}
                                    onAddClick={() => setShow(true)}
                                />
                            }
                        >
                            {(restaurant) => <RestaurantCard restaurant={restaurant} />}
                        </For>
                    </div>
                </Show>
                <Show when={auth.isAuthenticated()}>
                    <AddRestaurantDialog show={show()} onOpenChange={setShow} />
                </Show>
            </div>
        </PageLayout>
    )
}
