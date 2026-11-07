import {
    ArrowCounterClockwiseIcon,
    CaretDownIcon,
    MagnifyingGlassIcon,
    NavigationArrowIcon,
    PencilLineIcon,
    TrashIcon,
} from "@phosphor-icons/react"
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
import { Button } from "@ui/button"
import { Card } from "@ui/card"
import { Dialog, DialogAction, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from "@ui/dialog"
import { IconButton } from "@ui/icon-button"
import { OpeningHoursDialog } from "@ui/opening-hours-dialog"

import { EditRestaurantDialog } from "./edit-restaurant-dialog"
import { RestaurantGallery } from "./restaurant-gallery"
import { RestaurantHeader } from "./restaurant-header"
import { RestaurantInterestButton } from "./restaurant-interest-button"

const RestaurantCardMapView = lazy(async () =>
    import("./restaurant-card-map").then((module) => ({ default: module.RestaurantCardMapView })),
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
    const [dialog, setDialog] = useState<"closed" | "edit" | "hours" | "delete">("closed")
    const [isRefreshing, setIsRefreshing] = useState(false)
    const updateRestaurant = useUpdateRestaurant()
    const deleteRestaurant = useDeleteRestaurant()
    const auth = useAuth()
    const refreshOpeningHours = useRefreshOpeningHours()
    const lookupPlaceIdAndHours = useLookupPlaceIdAndHours()

    const enrichment = restaurant.address.enrichment
    const hasPlaceId = enrichment?.placeId !== undefined && enrichment?.placeId !== ""

    const runHoursLookup = (lookup: {
        mutate: (
            args: { restaurantId: Restaurant["_id"] },
            opts: { onError: () => void; onSettled: () => void },
        ) => void
    }) => {
        setIsRefreshing(true)
        lookup.mutate(
            { restaurantId: restaurant._id },
            {
                onError: () => {},
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
        deleteRestaurant.mutate(
            { id: restaurant._id },
            {
                onError: () => {},
            },
        )
    }

    const coords = restaurant.address.enrichment?.coords
    const hasLocation = coords !== undefined

    const photos = restaurant.images.map((img) => ({ url: img.url }))

    const active = social ?? emptySocialSummary
    const handleToggleWant = onToggleWant ?? (() => {})

    const handleRate = async (rating: number) => {
        await updateRestaurant.mutateAsync({ id: restaurant._id, rating })
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
                                        setDialog("edit")
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
                <RestaurantCardNotes notes={restaurant.details?.notes ?? undefined} />
                <div className="px-5 pt-1 pb-2 md:px-4">
                    <RestaurantInterestButton
                        wanted={active.wanted}
                        wantCount={active.wantCount}
                        onToggleWant={handleToggleWant}
                    />
                </div>
                {hasLocation && coords !== undefined && <RestaurantCardMap location={coords} name={restaurant.name} />}
                <div className="px-5 py-2 md:px-4 md:py-2">
                    <EmojiRating rating={restaurant.rating} onRate={handleRate} />
                </div>
            </Card>

            <EditRestaurantDialog
                show={dialog === "edit"}
                onOpenChange={handleDialogOpenChange}
                restaurant={restaurant}
            />
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

function RestaurantCardMap({
    location,
    name,
}: Readonly<{
    location: Readonly<{ readonly lat: number; readonly lng: number }>
    name: string | undefined
}>) {
    const [showMap, setShowMap] = useState(false)
    return (
        <div className="px-5 md:px-4">
            <button
                type="button"
                onClick={() => {
                    setShowMap(!showMap)
                }}
                aria-expanded={showMap}
                className="group/trigger flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors duration-200 hover:border-border hover:bg-surface-muted"
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-surface-muted transition-colors duration-200 group-hover/trigger:bg-tomato-100">
                        <NavigationArrowIcon
                            className="size-3.5 text-muted-foreground transition-colors duration-200 group-hover/trigger:text-tomato-600"
                            aria-hidden="true"
                        />
                    </div>
                    <span className="font-medium">View on Map</span>
                </div>
                <CaretDownIcon
                    aria-hidden="true"
                    className={`size-4 text-muted-foreground transition-transform duration-300 ease-out-quad ${showMap ? "rotate-180" : ""}`}
                />
            </button>
            {showMap && (
                <Suspense
                    fallback={
                        <div
                            className="mt-2 aspect-video w-full animate-pulse rounded-xl bg-surface-muted"
                            aria-hidden="true"
                        />
                    }
                >
                    <RestaurantCardMapView location={location} name={name} />
                </Suspense>
            )}
        </div>
    )
}

function DeleteConfirmDialog({
    show,
    onOpenChange,
    onConfirm,
    restaurantName,
}: Readonly<{
    show: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    restaurantName: string
}>) {
    return (
        <Dialog show={show} onOpenChange={onOpenChange}>
            <DialogBackdrop>
                <DialogPanel size="sm">
                    <DialogTitle>Delete restaurant</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong className="text-foreground">{restaurantName}</strong>?
                        This action cannot be undone.
                    </DialogDescription>
                    <div className="mt-6 flex justify-end gap-2">
                        <DialogAction
                            render={
                                <Button tone="secondary" size="md">
                                    Cancel
                                </Button>
                            }
                        />
                        <Button
                            tone="destructive"
                            size="md"
                            onClick={() => {
                                onConfirm()
                                onOpenChange(false)
                            }}
                        >
                            Delete
                        </Button>
                    </div>
                </DialogPanel>
            </DialogBackdrop>
        </Dialog>
    )
}
