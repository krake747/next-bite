import { type Restaurant } from "@core/restaurants"

import { RestaurantDialog } from "./restaurant-dialog"

export function EditRestaurantDialog({
    show,
    onOpenChange,
    restaurant,
}: Readonly<{
    show: boolean
    onOpenChange: (open: boolean) => void
    restaurant: Restaurant
}>) {
    return <RestaurantDialog mode="edit" show={show} onOpenChange={onOpenChange} restaurant={restaurant} />
}
