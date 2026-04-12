import { For, Show, type Accessor } from "solid-js"
import { RestaurantCard } from "./restaurant-card"
import { EmptyRestaurantsState } from "./empty-restaurants-state"
import type { Restaurant } from "../../core/hooks"

interface RestaurantListProps {
    restaurants: Accessor<Restaurant[]>
    hasFilter?: boolean
    hasSearch?: boolean
    onAddClick: () => void
}

export function RestaurantList(props: RestaurantListProps) {
    const hasF = props.hasFilter ?? false
    const hasS = props.hasSearch ?? false

    return (
        <div data-component="restaurant-list" class="grid gap-8 md:grid-cols-2 md:gap-10">
            <Show
                when={props.restaurants().length > 0}
                fallback={<EmptyRestaurantsState hasFilter={hasF} hasSearch={hasS} onAddClick={props.onAddClick} />}
            >
                <For each={props.restaurants()}>
                    {(restaurant, index) => (
                        <RestaurantCard
                            restaurant={restaurant}
                            style={{
                                "animation-delay": `${index() * 100}ms`,
                            }}
                            class="animate-card-enter"
                        />
                    )}
                </For>
            </Show>
        </div>
    )
}
