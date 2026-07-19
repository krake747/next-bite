import { useEffect, useRef } from "react"
import { RestaurantCard } from "./restaurant-card"
import { EmptyRestaurantsState } from "./empty-restaurants-state"
import type { Restaurant } from "@core/hooks"

const animatedRestaurantIds = new Set<string>()

type RestaurantListProps = {
    restaurants: Restaurant[]
    hasFilter?: boolean
    hasSearch?: boolean
    onAddClick: () => void
    sortOrder?: "added" | "name"
}

export function RestaurantList({ restaurants, hasFilter, hasSearch, onAddClick, sortOrder }: RestaurantListProps) {
    const previousSortOrder = useRef(sortOrder)

    useEffect(() => {
        if (sortOrder !== previousSortOrder.current) {
            animatedRestaurantIds.clear()
            previousSortOrder.current = sortOrder
        }
    }, [sortOrder])

    const getAnimationProps = (restaurant: Restaurant, index: number) => {
        if (sortOrder === "name") return {}
        if (animatedRestaurantIds.has(restaurant._id)) return {}
        animatedRestaurantIds.add(restaurant._id)
        return {
            className: "animate-card-enter",
            style: { animationDelay: `${index * 100}ms` },
        }
    }

    return (
        <div data-component="restaurant-list" className="grid gap-8 md:grid-cols-2 md:gap-10">
            {restaurants.length > 0 ? (
                restaurants.map((restaurant, index) => {
                    const animationProps = getAnimationProps(restaurant, index)
                    return (
                        <RestaurantCard
                            key={restaurant._id}
                            restaurant={restaurant}
                            style={animationProps.style}
                            className={animationProps.className}
                        />
                    )
                })
            ) : (
                <EmptyRestaurantsState
                    hasFilter={hasFilter ?? false}
                    hasSearch={hasSearch ?? false}
                    onAddClick={onAddClick}
                />
            )}
        </div>
    )
}
