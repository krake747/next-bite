import { For, Show, type Accessor, createEffect } from "solid-js"
import { RestaurantCard } from "./restaurant-card"
import { EmptyRestaurantsState } from "./empty-restaurants-state"
import type { Restaurant } from "../../core/hooks"

// Track which restaurant IDs have already been animated (persists across re-renders)
const animatedRestaurantIds = new Set<string>()

type RestaurantListProps = {
    restaurants: Accessor<Restaurant[]>
    hasFilter?: boolean
    hasSearch?: boolean
    onAddClick: () => void
    sortOrder?: "added" | "name"
}

export function RestaurantList(props: RestaurantListProps) {
    // Track previous sort order to detect changes
    let previousSortOrder = props.sortOrder

    createEffect(() => {
        const currentSort = props.sortOrder
        // If sort order changed, clear animations so cards don't re-animate
        if (currentSort !== previousSortOrder) {
            animatedRestaurantIds.clear()
            previousSortOrder = currentSort
        }
    })

    const getAnimationProps = (restaurant: Restaurant, index: number) => {
        // Skip animations entirely when sorting by name
        if (props.sortOrder === "name") {
            return {}
        }
        // If this ID was already animated, don't animate again
        if (animatedRestaurantIds.has(restaurant._id)) {
            return {}
        }
        // Mark ID as animated and apply animation
        animatedRestaurantIds.add(restaurant._id)
        return {
            class: "animate-card-enter",
            style: { "animation-delay": `${index * 100}ms` },
        }
    }

    return (
        <div data-component="restaurant-list" class="grid gap-8 md:grid-cols-2 md:gap-10">
            <Show
                when={props.restaurants().length > 0}
                fallback={
                    <EmptyRestaurantsState
                        hasFilter={props.hasFilter ?? false}
                        hasSearch={props.hasSearch ?? false}
                        onAddClick={props.onAddClick}
                    />
                }
            >
                <For each={props.restaurants()}>
                    {(restaurant, index) => {
                        const animationProps = getAnimationProps(restaurant, index())
                        return (
                            <RestaurantCard
                                restaurant={restaurant}
                                style={animationProps.style}
                                class={animationProps.class}
                            />
                        )
                    }}
                </For>
            </Show>
        </div>
    )
}
