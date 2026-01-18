import { createSignal } from "solid-js"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Badge } from "../ui/badge"
import { MapPin, Utensils, ExternalLink, SquarePen } from "lucide-solid"
import type { Restaurant } from "../core/hooks"
import { EditRestaurantDialog } from "./edit-restaurant-dialog"

export function RestaurantCard(props: { restaurant: Restaurant }) {
    const [showEdit, setShowEdit] = createSignal(false)

    return (
        <>
            <Card>
            <CardHeader class="grid grid-cols-[1fr_auto]">
                <h3 class="text-xl font-semibold">{props.restaurant.name} </h3>
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        class="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        title="Edit restaurant"
                    >
                        <SquarePen class="size-4" />
                    </button>
                    <Badge variant="gray">
                        <Utensils class="mr-1.5 size-3" />
                        {props.restaurant.cuisine}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent class="flex flex-1 flex-col justify-between gap-1">
                <p class="text-neutral-500 dark:text-neutral-400">{props.restaurant.notes}</p>
                <div class="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                    <div class="flex items-center">
                        <MapPin class="mr-1.5 size-3.5 shrink-0" />
                        {props.restaurant.location}
                    </div>
                    {props.restaurant.link && (
                        <a
                            href={props.restaurant.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="ml-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                        >
                            <ExternalLink class="size-4" />
                        </a>
                    )}
                </div>
            </CardContent>
            <CardFooter class="text-neutral-500 dark:text-neutral-400">
                Proposed by{" "}
                <span class="font-medium text-neutral-900 dark:text-neutral-100">{props.restaurant.addedBy}</span>
            </CardFooter>
        </Card>
            <EditRestaurantDialog
                show={showEdit()}
                onOpenChange={setShowEdit}
                restaurant={props.restaurant}
            />
        </>
    )
}
