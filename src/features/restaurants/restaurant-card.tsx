import { lazy, Suspense } from "react"

import { type Restaurant } from "@core/restaurants"
import { Card } from "@ui/card"

import { RestaurantGallery } from "./restaurant-gallery"
import { RestaurantHeader } from "./restaurant-header"
import { RestaurantInterestButton } from "./restaurant-interest-button"

const RestaurantCardMap = lazy(async () =>
    import("./restaurant-card-map").then((module) => ({ default: module.RestaurantCardMap })),
)

export function RestaurantCard({
    restaurant,
    onToggleWant,
    detailsHref,
    ...cardProps
}: Readonly<
    {
        restaurant: Restaurant
        onToggleWant?: (() => void) | undefined
        detailsHref?: string | undefined
    } & React.ComponentProps<typeof Card>
>) {
    const coords = restaurant.address.google
    const hasLocation = coords?.lat !== undefined && coords?.lng !== undefined
    const handleToggleWant = onToggleWant ?? (() => {})

    return (
        <Card {...cardProps}>
            <RestaurantGallery photos={restaurant.photos} name={restaurant.name} cuisine={restaurant.cuisine} />
            <RestaurantHeader
                name={restaurant.name}
                link={restaurant.link}
                ownerName={restaurant.ownerName}
                wantCount={restaurant.wantCount}
                location={restaurant.address.label}
                hasLocation={hasLocation}
                detailsHref={detailsHref}
            />
            <RestaurantCardNotes notes={restaurant.note} />
            <div className="px-5 pt-1 pb-2 md:px-4">
                <RestaurantInterestButton
                    wanted={restaurant.mySave === "want"}
                    wantCount={restaurant.wantCount}
                    onToggleWant={handleToggleWant}
                />
            </div>
            {hasLocation && coords?.lat !== undefined && coords?.lng !== undefined && (
                <Suspense
                    fallback={
                        <div className="mx-5 aspect-video rounded-xl bg-surface-muted md:mx-4" aria-hidden="true" />
                    }
                >
                    <RestaurantCardMap location={{ lat: coords.lat, lng: coords.lng }} name={restaurant.name} />
                </Suspense>
            )}
        </Card>
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
