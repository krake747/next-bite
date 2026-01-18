import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Badge } from "../ui/badge"
import { MapPin, Utensils } from "lucide-solid"
import type { Restaurant } from "../core/types"

export function RestaurantCard(props: { restaurant: Restaurant }) {
    return (
        <Card>
            <CardHeader class="grid grid-cols-[1fr_auto]">
                <h3 class="text-xl font-semibold">{props.restaurant.name} </h3>
                <Badge variant="gray">
                    <Utensils class="mr-1.5 size-3" />
                    {props.restaurant.cuisine}
                </Badge>
            </CardHeader>
            <CardContent class="grid min-h-36 grid-rows-[1fr_auto]">
                <p class="text-neutral-500 dark:text-neutral-400">{props.restaurant.notes}</p>
                <div class="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                    <MapPin class="mr-1.5 size-3.5 shrink-0" />
                    {props.restaurant.location}
                </div>
            </CardContent>
            <CardFooter class="text-neutral-500 dark:text-neutral-400">
                Added by{" "}
                <span class="font-medium text-neutral-900 dark:text-neutral-100">{props.restaurant.addedBy}</span>
            </CardFooter>
        </Card>
    )
}
