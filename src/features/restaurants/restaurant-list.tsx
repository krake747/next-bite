import { type RestaurantSocial } from "@core/interests"
import { type Restaurant } from "@core/restaurants"

import { EmptyRestaurantsState } from "./empty-restaurants-state"
import { RestaurantCard } from "./restaurant-card"

type RestaurantListProps = {
    restaurants: ReadonlyArray<Restaurant>
    socialFor?: ((restaurant: Restaurant) => RestaurantSocial) | undefined
    onToggleWant?: ((restaurant: Restaurant) => void) | undefined
    detailsHrefFor?: ((restaurant: Restaurant) => string) | undefined
}

export function RestaurantList({
    restaurants,
    socialFor,
    onToggleWant,
    detailsHrefFor,
}: Readonly<RestaurantListProps>) {
    return (
        <div data-slot="restaurant-list" className="grid gap-8 md:grid-cols-2 md:gap-10">
            {restaurants.length > 0 ? (
                restaurants.map((restaurant: Restaurant) => {
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
                        />
                    )
                })
            ) : (
                <EmptyRestaurantsState />
            )}
        </div>
    )
}
