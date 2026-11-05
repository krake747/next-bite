import { Map, AdvancedMarker } from "@vis.gl/react-google-maps"
import ChevronDown from "lucide-react/icons/chevron-down"
import Navigation from "lucide-react/icons/navigation"
import RotateCcw from "lucide-react/icons/rotate-ccw"
import Search from "lucide-react/icons/search"
import SquarePen from "lucide-react/icons/square-pen"
import Trash2 from "lucide-react/icons/trash-2"
import { useState } from "react"

import {
    useUpdateRestaurant,
    useDeleteRestaurant,
    useAuth,
    useRefreshOpeningHours,
    useLookupPlaceIdAndHours,
    type Restaurant,
} from "@core/hooks"
import { emptySocial, type RestaurantSocial } from "@core/social"
import { EmojiRating } from "@pattern/emoji-rating"
import { Button } from "@ui/button"
import { Card } from "@ui/card"
import { Dialog, DialogAction, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from "@ui/dialog"
import { OpeningHoursDialog } from "@ui/opening-hours-dialog"

import { EditRestaurantDialog } from "./edit-restaurant-dialog"
import { RestaurantGallery } from "./restaurant-gallery"
import { RestaurantHeader } from "./restaurant-header"
import { RestaurantInterestButton } from "./restaurant-interest-button"

export function RestaurantCard({
    restaurant,
    social,
    onToggleWant,
    detailsHref,
    ...cardProps
}: Readonly<{
    restaurant: Restaurant
    social?: RestaurantSocial | undefined
    onToggleWant?: (() => void) | undefined
    detailsHref?: string | undefined
    className?: string | undefined
    style?: Readonly<{ readonly animationDelay?: string }> | undefined
}>) {
    const [showEdit, setShowEdit] = useState(false)
    const [showMap, setShowMap] = useState(false)
    const [showHours, setShowHours] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const updateRestaurant = useUpdateRestaurant()
    const deleteRestaurant = useDeleteRestaurant()
    const auth = useAuth()
    const refreshOpeningHours = useRefreshOpeningHours()
    const lookupPlaceIdAndHours = useLookupPlaceIdAndHours()

    const hasPlaceId = restaurant.placeId !== undefined && restaurant.placeId !== ""

    const handleRefreshHours = () => {
        setIsRefreshing(true)
        refreshOpeningHours.mutate(
            { restaurantId: restaurant._id },
            {
                onError: () => {},
                onSettled: () => {
                    setIsRefreshing(false)
                },
            },
        )
    }

    const handleFindHours = () => {
        setIsRefreshing(true)
        lookupPlaceIdAndHours.mutate(
            { restaurantId: restaurant._id },
            {
                onError: () => {},
                onSettled: () => {
                    setIsRefreshing(false)
                },
            },
        )
    }

    const handleDelete = () => {
        deleteRestaurant.mutate(
            { id: restaurant._id },
            {
                onError: () => {},
            },
        )
    }

    const hasLocation = restaurant.lat !== null && restaurant.lng !== null
    const location: { lat: number; lng: number } | null = hasLocation
        ? { lat: restaurant.lat!, lng: restaurant.lng! }
        : null

    const photos = (restaurant.images ?? []).map((img) => ({ url: img.url }))

    const active = social ?? emptySocial
    const handleToggleWant = onToggleWant ?? (() => {})

    const handleRate = async (rating: number) => {
        await updateRestaurant.mutateAsync({ id: restaurant._id, rating })
    }

    const directionsUrl = location
        ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
        : undefined

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
                                    <button
                                        type="button"
                                        onClick={handleRefreshHours}
                                        disabled={isRefreshing}
                                        aria-label="Refresh hours"
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-stone-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-surface hover:text-stone-900 hover:shadow-lg disabled:opacity-50"
                                        title="Refresh hours"
                                    >
                                        <RotateCcw className="size-3.5" aria-hidden="true" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleFindHours}
                                        disabled={isRefreshing}
                                        aria-label="Find hours"
                                        className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-stone-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-surface hover:text-stone-900 hover:shadow-lg disabled:opacity-50"
                                        title="Find hours"
                                    >
                                        <Search className="size-3.5" aria-hidden="true" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEdit(true)
                                    }}
                                    aria-label="Edit restaurant"
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-stone-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-surface hover:text-stone-900 hover:shadow-lg"
                                    title="Edit restaurant"
                                >
                                    <SquarePen className="size-3.5" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteConfirm(true)
                                    }}
                                    aria-label="Delete restaurant"
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/90 text-destructive shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-destructive/10 hover:shadow-lg"
                                    title="Delete restaurant"
                                >
                                    <Trash2 className="size-3.5" aria-hidden="true" />
                                </button>
                            </>
                        ) : undefined
                    }
                />
                <RestaurantHeader
                    name={restaurant.name}
                    link={restaurant.link}
                    addedBy={restaurant.addedBy}
                    wantCount={active.wantCount}
                    beenCount={active.beenCount}
                    location={restaurant.location}
                    hasLocation={hasLocation}
                    openingHours={restaurant.openingHours}
                    onShowHours={() => {
                        setShowHours(true)
                    }}
                    detailsHref={detailsHref}
                />
                <RestaurantCardNotes notes={restaurant.notes} />
                <div className="px-5 pt-1 pb-2 md:px-4">
                    <RestaurantInterestButton
                        wanted={active.wanted}
                        wantCount={active.wantCount}
                        onToggleWant={handleToggleWant}
                    />
                </div>
                {hasLocation && location && (
                    <RestaurantCardMap
                        showMap={showMap}
                        setShowMap={setShowMap}
                        location={location}
                        directionsUrl={directionsUrl!}
                        restaurant={restaurant}
                    />
                )}
                <RestaurantCardRating rating={restaurant.rating ?? null} onRate={handleRate} />
            </Card>

            <EditRestaurantDialog show={showEdit} onOpenChange={setShowEdit} restaurant={restaurant} />
            <OpeningHoursDialog
                show={showHours}
                onOpenChange={setShowHours}
                openingHours={restaurant.openingHours}
                restaurantName={restaurant.name}
            />
            <DeleteConfirmDialog
                show={showDeleteConfirm}
                onOpenChange={setShowDeleteConfirm}
                onConfirm={handleDelete}
                restaurantName={restaurant.name}
            />
        </>
    )
}

function RestaurantCardNotes({ notes }: Readonly<{ notes: string | null | undefined }>) {
    if (notes === null || notes === undefined || notes === "") {
        return null
    }
    return (
        <div className="px-5 pb-2 md:px-4">
            <div className="relative">
                <div
                    className="absolute -top-1 left-2 font-serif text-5xl leading-none text-tomato-400/30 select-none"
                    style={{ fontFamily: "var(--font-display)" }}
                    aria-hidden="true"
                >
                    "
                </div>
                <div className="border-l-2 border-tomato-400/50 bg-tomato-50/30 py-3 pr-3 pl-5">
                    <p
                        className="text-sm leading-relaxed text-stone-700 italic"
                        style={{ fontFamily: "var(--font-body)" }}
                    >
                        {notes}
                    </p>
                </div>
            </div>
        </div>
    )
}

function RestaurantCardMap({
    showMap,
    setShowMap,
    location,
    directionsUrl,
    restaurant,
}: Readonly<{
    showMap: boolean
    setShowMap: (show: boolean) => void
    location: Readonly<{ readonly lat: number; readonly lng: number }>
    directionsUrl: string
    restaurant: Restaurant
}>) {
    return (
        <div className="px-5 md:px-4">
            <button
                type="button"
                onClick={() => {
                    setShowMap(!showMap)
                }}
                className="group/trigger flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm text-stone-600 transition-all duration-200 hover:border-stone-200 hover:bg-stone-50"
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-stone-100 transition-colors duration-200 group-hover/trigger:bg-tomato-100">
                        <Navigation className="size-3.5 text-stone-500 transition-colors duration-200 group-hover/trigger:text-tomato-600" />
                    </div>
                    <span className="font-medium">View on Map</span>
                </div>
                <ChevronDown
                    className={`size-4 text-stone-400 transition-transform duration-300 ease-out ${showMap ? "rotate-180" : ""}`}
                />
            </button>
            {showMap && (
                <div>
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-stone-200 shadow-inner transition-shadow duration-200 hover:shadow-md"
                        title="Get directions"
                    >
                        <Map
                            center={location}
                            zoom={15}
                            mapId="DEMO_MAP_ID"
                            disableDefaultUI
                            zoomControl={false}
                            mapTypeControl={false}
                            streetViewControl={false}
                            fullscreenControl={false}
                            scrollwheel={false}
                            style={{ width: "100%", height: "100%" }}
                        >
                            <AdvancedMarker position={location} title={restaurant.name ?? undefined} />
                        </Map>
                    </a>
                    <p className="mt-2 text-center text-xs text-stone-500">Click map to get directions</p>
                </div>
            )}
        </div>
    )
}

function RestaurantCardRating({
    rating,
    onRate,
}: Readonly<{
    rating: number | null
    onRate: (rating: number) => void | Promise<void>
}>) {
    return (
        <div className="px-5 py-2 md:px-4 md:py-2">
            <EmojiRating rating={rating} onRate={onRate} />
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
                        Are you sure you want to delete <strong className="text-stone-900">{restaurantName}</strong>?
                        This action cannot be undone.
                    </DialogDescription>
                    <div className="mt-6 flex justify-end gap-2">
                        <DialogAction
                            render={
                                <Button variant="secondary" size="md">
                                    Cancel
                                </Button>
                            }
                        />
                        <Button
                            variant="destructive"
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
