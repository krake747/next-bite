import { For, createSignal } from "solid-js"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Header } from "./features/header"
import { Friends, Restaurants } from "./features/data"
import { Badge } from "./ui/badge"
import { MapPin, Utensils, Funnel } from "lucide-solid"
import { Footer } from "./features/footer"
import { type Friend } from "./features/types"
import { cx } from "./ui/variants"

export function App() {
    const [friendFilter, setFriendFilter] = createSignal<string | null>(null)

    const filteredRestaurants = () =>
        friendFilter() ? Restaurants.filter((r) => r.addedBy === friendFilter()) : Restaurants

    const handleFriendFilter = (f: Friend) => {
        return () => setFriendFilter(f.name === friendFilter() ? null : f.name)
    }

    return (
        <div class="flex min-h-screen flex-col text-neutral-900 dark:text-white">
            <div class="container mx-auto max-w-7xl flex-1 px-4 pb-8">
                <Header count={filteredRestaurants().length} />
                <div class="mb-4 flex items-center gap-1.5">
                    <Funnel class={cx("mr-1.5 size-4 text-neutral-500", friendFilter() && "fill-neutral-500")} />
                    <For each={Friends}>
                        {(friend) => (
                            <Badge
                                as="button"
                                class={cx(
                                    "cursor-pointer",
                                    friendFilter() === friend.name && "bg-flame-pea-100 text-flame-pea-800",
                                )}
                                onClick={handleFriendFilter(friend)}
                            >
                                {friend.name}
                            </Badge>
                        )}
                    </For>
                </div>
                <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <For each={filteredRestaurants()}>
                        {(restaurant) => (
                            <Card>
                                <CardHeader class="grid grid-cols-[1fr_auto]">
                                    <h3 class="text-xl font-semibold">{restaurant.name} </h3>
                                    <Badge variant="gray">
                                        <Utensils class="mr-1.5 size-3" />
                                        {restaurant.cuisine}
                                    </Badge>
                                </CardHeader>
                                <CardContent class="grid min-h-36 grid-rows-[1fr_auto]">
                                    <p class="text-neutral-500 dark:text-neutral-400">{restaurant.notes}</p>
                                    <div class="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                                        <MapPin class="mr-1.5 size-3.5 shrink-0" />
                                        {restaurant.location}
                                    </div>
                                </CardContent>
                                <CardFooter class="text-neutral-500 dark:text-neutral-400">
                                    Added by{" "}
                                    <span class="font-medium text-neutral-900 dark:text-neutral-100">
                                        {restaurant.addedBy}
                                    </span>
                                </CardFooter>
                            </Card>
                        )}
                    </For>
                </div>
            </div>
            <Footer />
        </div>
    )
}
