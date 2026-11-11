import { lazy, Suspense, useState } from "react"

import { emptySocial, type RestaurantSocial } from "@core/interests"
import { useDeleteRestaurant, type Restaurant } from "@core/restaurants"
import { Card } from "@ui/card"

import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { OpeningHoursDialog } from "./opening-hours-dialog"
import { RestaurantCardActions } from "./restaurant-card-actions"
import { RestaurantGallery } from "./restaurant-gallery"
import { RestaurantHeader } from "./restaurant-header"
import { RestaurantInterestButton } from "./restaurant-interest-button"

const RestaurantCardMap = lazy(async () =>
    import("./restaurant-card-map").then((module) => ({ default: module.RestaurantCardMap })),
)

export function RestaurantCard({
    restaurant,
    social,
    onToggleWant,
    detailsHref,
    ...cardProps
}: Readonly<
    {
        restaurant: Restaurant
        social?: RestaurantSocial | undefined
        onToggleWant?: (() => void) | undefined
        detailsHref?: string | undefined
    } & React.ComponentProps<typeof Card>
>) {
    const [dialog, setDialog] = useState<"closed" | "hours" | "delete">("closed")
    const deleteRestaurant = useDeleteRestaurant()

    const enrichment = restaurant.address.enrichment
    const hasPlaceId = enrichment?.placeId !== undefined && enrichment?.placeId !== ""

    const handleDelete = () => {
        deleteRestaurant.mutate({ id: restaurant._id })
    }

    const coords = restaurant.address.enrichment?.coords
    const hasLocation = coords !== undefined

    const photos = restaurant.images.map((img) => ({ url: img.url }))

    const active = social ?? emptySocial
    const handleToggleWant = onToggleWant ?? (() => {})

    const handleDialogOpenChange = (open: boolean) => {
        if (!open) {
            setDialog("closed")
        }
    }

    return (
        <>
            <Card {...cardProps}>
                <RestaurantGallery
                    photos={photos}
                    name={restaurant.name}
                    cuisine={restaurant.cuisine}
                    actions={
                        <RestaurantCardActions
                            restaurantId={restaurant._id}
                            detailsHref={detailsHref}
                            hasPlaceId={hasPlaceId}
                            onDeleteRequest={() => {
                                setDialog("delete")
                            }}
                        />
                    }
                />
                <RestaurantHeader
                    name={restaurant.name}
                    link={restaurant.details?.link}
                    ownerName={restaurant.ownerName}
                    wantCount={active.wantCount}
                    beenCount={active.beenCount}
                    location={restaurant.address.label}
                    hasLocation={hasLocation}
                    openingHours={restaurant.address.enrichment?.openingHours}
                    onShowHours={() => {
                        setDialog("hours")
                    }}
                    detailsHref={detailsHref}
                />
                <RestaurantCardNotes notes={restaurant.details?.notes} />
                <div className="px-5 pt-1 pb-2 md:px-4">
                    <RestaurantInterestButton
                        wanted={active.wanted}
                        wantCount={active.wantCount}
                        onToggleWant={handleToggleWant}
                    />
                </div>
                {hasLocation && coords !== undefined && (
                    <Suspense
                        fallback={
                            <div className="mx-5 aspect-video rounded-xl bg-surface-muted md:mx-4" aria-hidden="true" />
                        }
                    >
                        <RestaurantCardMap location={coords} name={restaurant.name} />
                    </Suspense>
                )}
            </Card>

            <OpeningHoursDialog
                show={dialog === "hours"}
                onOpenChange={handleDialogOpenChange}
                openingHours={restaurant.address.enrichment?.openingHours}
                restaurantName={restaurant.name}
            />
            <DeleteConfirmDialog
                show={dialog === "delete"}
                onOpenChange={handleDialogOpenChange}
                onConfirm={handleDelete}
                restaurantName={restaurant.name}
            />
        </>
    )
}

function RestaurantCardNotes({ notes }: Readonly<{ notes: string | undefined }>) {
    if (notes === undefined || notes === "") {
        return null
    }
    return (
        <div className="px-5 pb-2 md:px-4">
            <div className="relative">
                <div
                    className="absolute -top-1 left-2 font-display text-5xl leading-none text-tomato-400/30 select-none"
                    aria-hidden="true"
                >
                    "
                </div>
                <div className="border-l-2 border-tomato-400/50 bg-tomato-50/30 py-3 pr-3 pl-5">
                    <p className="text-sm leading-relaxed text-foreground italic">{notes}</p>
                </div>
            </div>
        </div>
    )
}
