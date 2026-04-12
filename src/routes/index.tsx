import { For, createSignal, createMemo, Show } from "solid-js"
import { createFileRoute, useNavigate } from "@tanstack/solid-router"
import { Header, HeaderSubtitle, HeaderTitle } from "../features/header"
import { useRestaurants, useAuth } from "../core/hooks"
import { Footer } from "../features/footer"
import { RestaurantCard } from "../features/restaurant-card"
import { FriendsFilter } from "../features/friends-filter"
import { AddRestaurantDialog } from "../features/add-restaurant-dialog"
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
        <div class="flex min-h-screen flex-col">
            <main class="container mx-auto max-w-7xl flex-1 px-4 pb-8">
                <Header>
                    <HeaderTitle>Our next bite</HeaderTitle>
                    <HeaderSubtitle>{count()} places we're dreaming of trying together</HeaderSubtitle>
                </Header>
                <Show when={restaurants()} fallback={<Loading message="restaurants" />}>
                    <FriendsFilter
                        filter={filter()}
                        handleFilter={setFilter}
                        search={search()}
                        handleSearch={setSearch}
                    >
                        <div class="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                            <Button onClick={() => navigate({ from: Route.fullPath, to: "/wheel" })}>
                                <LoaderPinwheel class="size-4" />
                                Spin the wheel
                            </Button>
                            <Show when={auth.isAuthenticated()}>
                                <Button onClick={() => setShow(true)}>
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
                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <For each={filteredRestaurants()} fallback={<span>No restaurants found...</span>}>
                            {(restaurant) => <RestaurantCard restaurant={restaurant} />}
                        </For>
                    </div>
                </Show>
                <Show when={auth.isAuthenticated()}>
                    <AddRestaurantDialog show={show()} onOpenChange={setShow} />
                </Show>
            </main>
            <Footer />
        </div>
    )
}
