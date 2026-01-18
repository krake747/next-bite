import { For, createSignal, createMemo, Suspense, Show } from "solid-js"
import { Header } from "./features/header"
import { useFriends, useRestaurants, type Restaurant } from "./core/hooks"
import { Footer } from "./features/footer"
import { RestaurantCard } from "./features/restaurant-card"
import { Filters } from "./features/filters"
import { AddRestaurantDialog } from "./features/add-restaurant-dialog"
import { Loading } from "./ui/loading"
import { Button } from "./ui/button"
import { Plus } from "lucide-solid"

export function App() {
    const [friendFilter, setFriendFilter] = createSignal<string | null>(null)
    const [show, setShow] = createSignal(false)

    const restaurants = useRestaurants()
    const friends = useFriends()

    const filteredRestaurants = createMemo(() =>
        friendFilter() ? restaurants()?.filter((r: Restaurant) => r.addedBy === friendFilter()) : restaurants(),
    )

    const count = createMemo(() => filteredRestaurants()?.length ?? 0)

    return (
        <div class="flex min-h-screen flex-col text-neutral-900 dark:text-white">
            <main class="container mx-auto max-w-7xl flex-1 px-4 pb-8">
                <Suspense fallback={<Loading />}>
                    <Header count={count} />
                    <Show when={friends()}>
                        {(friends) => (
                            <Filters
                                friends={friends()}
                                friendFilter={friendFilter()}
                                handleFilterChange={setFriendFilter}
                            >
                                <Button onClick={() => setShow(true)} class="sm:ml-auto">
                                    <Plus class="size-4" />
                                    Add Restaurant
                                </Button>
                            </Filters>
                        )}
                    </Show>
                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <For each={filteredRestaurants()}>
                            {(restaurant) => <RestaurantCard restaurant={restaurant} />}
                        </For>
                    </div>
                    <AddRestaurantDialog show={show()} onOpenChange={setShow} />
                </Suspense>
            </main>
            <Footer />
        </div>
    )
}
