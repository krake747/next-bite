import { ArrowCounterClockwiseIcon, MagnifyingGlassIcon, PencilLineIcon, TrashIcon } from "@phosphor-icons/react"
import { useNavigate } from "@tanstack/react-router"
import { lazy, Suspense, useState } from "react"

import {
    useUpdateRestaurant,
    useDeleteRestaurant,
    useRefreshOpeningHours,
    useLookupPlaceIdAndHours,
    type Restaurant,
} from "@core/restaurants"
import { useAuth } from "@core/session"
import { emptySocialSummary, type RestaurantSocial, type RestaurantSocialSummary } from "@core/social"
import { EmojiRating } from "@pattern/emoji-rating"
import { Card } from "@ui/card"
import { IconButton } from "@ui/icon-button"

import { DeleteConfirmDialog } from "./delete-confirm-dialog"
import { OpeningHoursDialog } from "./opening-hours-dialog"
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
        social?: RestaurantSocial | RestaurantSocialSummary | undefined
        onToggleWant?: (() => void) | undefined
        detailsHref?: string | undefined
    } & React.ComponentProps<typeof Card>
>) {
    const [dialog, setDialog] = useState<"closed" | "hours" | "delete">("closed")
    const [isRefreshing, setIsRefreshing] = useState(false)
    const navigate = useNavigate()
    const updateRestaurant = useUpdateRestaurant()
    const deleteRestaurant = useDeleteRestaurant()
    const auth = useAuth()
    const refreshOpeningHours = useRefreshOpeningHours()
    const lookupPlaceIdAndHours = useLookupPlaceIdAndHours()

    const enrichment = restaurant.address.enrichment
    const hasPlaceId = enrichment?.placeId !== undefined && enrichment?.placeId !== ""

    const runHoursLookup = (lookup: {
        mutate: (args: { restaurantId: Restaurant["_id"] }, opts: { onSettled: () => void }) => void
    }) => {
        setIsRefreshing(true)
        lookup.mutate(
            { restaurantId: restaurant._id },
            {
                onSettled: () => {
                    setIsRefreshing(false)
                },
            },
        )
    }

    const handleRefreshHours = () => {
        runHoursLookup(refreshOpeningHours)
    }

    const handleFindHours = () => {
        runHoursLookup(lookupPlaceIdAndHours)
    }

    const handleDelete = () => {
        deleteRestaurant.mutate({ id: restaurant._id })
    }

    const coords = restaurant.address.enrichment?.coords
    const hasLocation = coords !== undefined

    const photos = restaurant.images.map((img) => ({ url: img.url }))

    const active = social ?? emptySocialSummary
    const handleToggleWant = onToggleWant ?? (() => {})

    const handleRate = async (index: number) => {
        await updateRestaurant.mutateAsync({ id: restaurant._id, rating: index + 1 })
    }

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
                        auth.isAuthenticated ? (
                            <>
                                {hasPlaceId ? (
                                    <IconButton
                                        label="Refresh hours"
                                        size="sm"
                                        disabled={isRefreshing}
                                        onClick={handleRefreshHours}
                                    >
                                        <ArrowCounterClockwiseIcon className="size-3.5" />
                                    </IconButton>
                                ) : (
                                    <IconButton
                                        label="Find hours"
                                        size="sm"
                                        disabled={isRefreshing}
                                        onClick={handleFindHours}
                                    >
                                        <MagnifyingGlassIcon className="size-3.5" />
                                    </IconButton>
                                )}
                                <IconButton
                                    label="Edit restaurant"
                                    size="sm"
                                    onClick={() => {
                                        void navigate({
                                            to: detailsHref ?? `/restaurants/${restaurant._id}`,
                                        })
                                    }}
                                >
                                    <PencilLineIcon className="size-3.5" />
                                </IconButton>
                                <IconButton
                                    label="Delete restaurant"
                                    size="sm"
                                    tone="destructive"
                                    onClick={() => {
                                        setDialog("delete")
                                    }}
                                >
                                    <TrashIcon className="size-3.5" />
                                </IconButton>
                            </>
                        ) : undefined
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
                <div className="px-5 py-2 md:px-4 md:py-2">
                    <EmojiRating
                        rating={restaurant.rating !== undefined ? restaurant.rating - 1 : undefined}
                        onRate={handleRate}
                    />
                </div>
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
