import { useEffect, useRef } from "react"

import { type Restaurant } from "@core/hooks"
import { type RestaurantSocial, type RestaurantSocialSummary } from "@core/social"

import { EmptyRestaurantsState } from "./empty-restaurants-state"
import { RestaurantCard } from "./restaurant-card"

const animatedRestaurantIds = new Set<string>()

type RestaurantListProps = {
    restaurants: ReadonlyArray<Restaurant>
    hasFilter?: boolean | undefined
    hasSearch?: boolean | undefined
    onAddClick: () => void
    sortOrder?: "added" | "name" | undefined
    socialFor?: ((restaurant: Restaurant) => RestaurantSocial | RestaurantSocialSummary) | undefined
    onToggleWant?: ((restaurant: Restaurant) => void) | undefined
    detailsHrefFor?: ((restaurant: Restaurant) => string) | undefined
}

export function RestaurantList({
    restaurants,
    hasFilter,
    hasSearch,
    onAddClick,
    sortOrder,
    socialFor,
    onToggleWant,
    detailsHrefFor,
}: Readonly<RestaurantListProps>) {
    const previousSortOrder = useRef(sortOrder)

    useEffect(() => {
        if (sortOrder !== previousSortOrder.current) {
            animatedRestaurantIds.clear()
            previousSortOrder.current = sortOrder
        }
    }, [sortOrder])

    const getAnimationProps = (restaurant: Restaurant, index: number) => {
        if (sortOrder === "name") {
            return {}
        }
        if (animatedRestaurantIds.has(restaurant._id)) {
            return {}
        }
        animatedRestaurantIds.add(restaurant._id)
        return {
            className: "animate-card-enter",
            style: { animationDelay: `${index * 100}ms` },
        }
    }

    return (
        <div data-slot="restaurant-list" className="grid gap-8 md:grid-cols-2 md:gap-10">
            {restaurants.length > 0 ? (
                restaurants.map((restaurant: Restaurant, index: number) => {
                    const animationProps = getAnimationProps(restaurant, index)
                    return (
                        <RestaurantCard
                            key={restaurant._id}
                            restaurant={restaurant}
                            social={socialFor?.(restaurant)}
                            onToggleWant={
                                onToggleWant === undefined
                                    ? undefined
                                    : () => {
                                          onToggleWant(restaurant)
                                      }
                            }
                            detailsHref={detailsHrefFor?.(restaurant)}
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
