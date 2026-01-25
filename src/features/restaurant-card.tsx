import { createSignal, splitProps } from "solid-js"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Badge } from "../ui/badge"
import MapPin from "lucide-solid/icons/map-pin"
import Utensils from "lucide-solid/icons/utensils"
import ExternalLink from "lucide-solid/icons/external-link"
import SquarePen from "lucide-solid/icons/square-pen"
import { useUpdateRestaurant, type Restaurant } from "../core/hooks"
import { EditRestaurantDialog } from "./edit-restaurant-dialog"
import { EmojiRating } from "../ui/emoji-rating"
import type { ComponentProps } from "solid-js"

export function RestaurantCard(props: { restaurant: Restaurant } & ComponentProps<typeof Card>) {
    const [local, cardProps] = splitProps(props, ["restaurant"])
    const [showEdit, setShowEdit] = createSignal(false)
    const updateRestaurant = useUpdateRestaurant()

    const handleRate = async (rating: number) => {
        await updateRestaurant({ id: local.restaurant._id, rating })
    }

    return (
        <>
            <Card {...cardProps}>
                <CardHeader class="grid grid-cols-[1fr_auto]">
                    <h3 class="text-xl font-semibold">{local.restaurant.name} </h3>
                    <Badge variant="gray">
                        <Utensils class="mr-1.5 size-3" />
                        {local.restaurant.cuisine}
                    </Badge>
                </CardHeader>
                <CardContent class="flex flex-1 flex-col justify-between gap-2">
                    <p class="text-neutral-500 dark:text-neutral-400">{local.restaurant.notes}</p>
                    <div class="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                        <div class="flex items-center">
                            <MapPin class="mr-1.5 size-3.5 shrink-0" />
                            {local.restaurant.location}
                        </div>
                        {local.restaurant.link && (
                            <a
                                href={local.restaurant.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="flex items-center"
                                title="Visit menu"
                            >
                                <ExternalLink class="mr-1.5 size-3.5 shrink-0" />
                                Menu
                            </a>
                        )}
                    </div>
                </CardContent>
                <CardContent>
                    <EmojiRating rating={local.restaurant.rating ?? null} onRate={handleRate} />
                </CardContent>
                <CardFooter class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                    <span>
                        Proposed by{" "}
                        <span class="font-medium text-neutral-900 dark:text-neutral-100">
                            {local.restaurant.addedBy}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        class="cursor-pointer text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        title="Edit restaurant"
                    >
                        <SquarePen class="size-4" />
                    </button>
                </CardFooter>
            </Card>
            <EditRestaurantDialog show={showEdit()} onOpenChange={setShowEdit} restaurant={local.restaurant} />
        </>
    )
}
