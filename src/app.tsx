import { For, createSignal, createMemo, Suspense } from "solid-js"
import { Header } from "./features/header"
import { useFriends, useRestaurants, useAddRestaurant } from "./core/data"
import { Footer } from "./features/footer"
import { type Restaurant } from "./core/types"
import { RestaurantCard } from "./features/restaurant-card"
import { Filters } from "./features/filters"
import { AddRestaurantDialog } from "./features/add-restaurant-dialog"
import { Loading } from "./ui/loading"

export function App() {
    const [friendFilter, setFriendFilter] = createSignal<string | null>(null)
    const [isOpen, setIsOpen] = createSignal(false)

    const restaurants = useRestaurants()
    const friends = useFriends()
    const addRestaurant = useAddRestaurant()

    const filteredRestaurants = createMemo(() =>
        friendFilter() ? restaurants()?.filter((r: Restaurant) => r.addedBy === friendFilter()) : restaurants(),
    )

    const handleSubmit = async (output: any) => {
        try {
            await addRestaurant(output)
        } catch (error) {
            console.error("Error adding restaurant:", error)
        }
    }

    return (
        <div class="flex min-h-screen flex-col text-neutral-900 dark:text-white">
            <div class="container mx-auto max-w-7xl flex-1 px-4 pb-8">
                <Suspense fallback={<Loading />}>                             
                    <Header count={restaurants()?.length ?? 0} />
                    <Filters
                        friends={friends() ?? []}
                        friendFilter={friendFilter()}
                        handleFilterChange={setFriendFilter}
                        handleAddClick={() => setIsOpen(true)}
                    />
                    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <For each={filteredRestaurants()}>
                            {(restaurant) => <RestaurantCard restaurant={restaurant} />}
                        </For>
                    </div>
                    <AddRestaurantDialog
                        isOpen={isOpen()}
                        onOpenChange={setIsOpen}
                        friends={friends() || []}
                        onSubmit={handleSubmit}
                    />
                </Suspense>
            </div>
            <Footer />
        </div>
    )
}
