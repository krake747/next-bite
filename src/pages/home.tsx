import { For, createSignal, createMemo } from "solid-js"
import { Header, HeaderSubtitle, HeaderTitle } from "../features/header"
import { useRestaurants, type Restaurant } from "../core/hooks"
import { Footer } from "../features/footer"
import { RestaurantCard } from "../features/restaurant-card"
import { FriendsFilter } from "../features/friends-filter"
import { AddRestaurantDialog } from "../features/add-restaurant-dialog"
import { Button } from "../ui/button"
import LoaderPinwheel from "lucide-solid/icons/loader-pinwheel"
import Plus from "lucide-solid/icons/plus"
import { useNavigate } from "@solidjs/router"

export function Home() {
    const navigate = useNavigate()

    const [filter, setFilter] = createSignal<string | null>(null)
    const [show, setShow] = createSignal(false)

    const restaurants = useRestaurants()

    const filteredRestaurants = createMemo(() =>
        filter() ? restaurants().filter((r: Restaurant) => r.addedBy === filter()) : restaurants(),
    )

    const count = createMemo(() => filteredRestaurants().length)

    return (
        <div class="flex min-h-screen flex-col">
            <main class="container mx-auto max-w-7xl flex-1 px-4 pb-8">
                <Header>
                    <HeaderTitle>Our next bite</HeaderTitle>
                    <HeaderSubtitle>{count()} places we're dreaming of trying together</HeaderSubtitle>
                </Header>
                <FriendsFilter filter={filter()} handleFilter={setFilter}>
                    <div class="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                        <Button onClick={() => navigate("/wheel")}>
                            <LoaderPinwheel class="size-4" />
                            Spin the wheel
                        </Button>
                        <Button onClick={() => setShow(true)}>
                            <Plus class="size-4" />
                            Add Restaurant
                        </Button>
                    </div>
                </FriendsFilter>
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <For each={filteredRestaurants()} fallback={<span>No restaurants found...</span>}>
                        {(restaurant) => <RestaurantCard restaurant={restaurant} />}
                    </For>
                </div>
                <AddRestaurantDialog show={show()} onOpenChange={setShow} />
            </main>
            <Footer />
        </div>
    )
}
