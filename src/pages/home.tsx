import { For, createSignal, createMemo } from "solid-js"
import { Header } from "../features/header"
import { useRestaurants, type Restaurant } from "../core/hooks"
import { Footer } from "../features/footer"
import { RestaurantCard } from "../features/restaurant-card"
import { FriendsFilter } from "../features/friends-filter"
import { AddRestaurantDialog } from "../features/add-restaurant-dialog"
import { Button } from "../ui/button"
import { Plus } from "lucide-solid"

export function Home() {
    const [filter, setFilter] = createSignal<string | null>(null)
    const [show, setShow] = createSignal(false)

    const restaurants = useRestaurants()

    const filteredRestaurants = createMemo(() =>
        filter() ? restaurants()?.filter((r: Restaurant) => r.addedBy === filter()) : restaurants(),
    )

    const count = createMemo(() => filteredRestaurants()?.length ?? 0)

    return (
        <div class="flex min-h-screen flex-col">
            <main class="container mx-auto max-w-7xl flex-1 px-4 pb-8">
                <Header count={count} />
                <FriendsFilter filter={filter()} handleFilter={setFilter}>
                    <Button onClick={() => setShow(true)} class="sm:ml-auto">
                        <Plus class="size-4" />
                        Add Restaurant
                    </Button>
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