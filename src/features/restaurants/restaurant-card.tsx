import { Map, AdvancedMarker } from "@vis.gl/react-google-maps"
import ChevronDown from "lucide-react/icons/chevron-down"
import ExternalLink from "lucide-react/icons/external-link"
import Images from "lucide-react/icons/images"
import MapPin from "lucide-react/icons/map-pin"
import Navigation from "lucide-react/icons/navigation"
import RotateCcw from "lucide-react/icons/rotate-ccw"
import Search from "lucide-react/icons/search"
import SquarePen from "lucide-react/icons/square-pen"
import Trash2 from "lucide-react/icons/trash-2"
import Utensils from "lucide-react/icons/utensils"
import { useState } from "react"

import {
    useUpdateRestaurant,
    useDeleteRestaurant,
    useAuth,
    useRefreshOpeningHours,
    useLookupPlaceIdAndHours,
    type Restaurant,
} from "@core/hooks"
import { EmojiRating } from "@pattern/emoji-rating"
import { ImageGalleryModal } from "@pattern/image-gallery-modal"
import { LazyImage } from "@pattern/lazy-image"
import { Badge } from "@ui/badge"
import { Button } from "@ui/button"
import { Card } from "@ui/card"
import { Dialog, DialogAction, DialogBackdrop, DialogDescription, DialogPanel, DialogTitle } from "@ui/dialog"
import { OpeningHours } from "@ui/opening-hours"
import { OpeningHoursDialog } from "@ui/opening-hours-dialog"

import { EditRestaurantDialog } from "./edit-restaurant-dialog"

export function RestaurantCard({
    restaurant,
    ...cardProps
}: Readonly<{
    restaurant: Restaurant
    className?: string | undefined
    style?: Readonly<{ readonly animationDelay?: string }> | undefined
}>) {
    const [showEdit, setShowEdit] = useState(false)
    const [showGallery, setShowGallery] = useState(false)
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

    const hasImages = (restaurant.images?.length ?? 0) > 0
    const imageCount = restaurant.images?.length ?? 0
    const imageSrc = hasImages ? restaurant.images?.[0]?.url : undefined
    const imageUrls = restaurant.images?.map((img: Readonly<{ url: string }>) => img.url) ?? []

    const handleRate = async (rating: number) => {
        await updateRestaurant.mutateAsync({ id: restaurant._id, rating })
    }

    const directionsUrl = location
        ? `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
        : undefined

    return (
        <>
            <Card {...cardProps}>
                <RestaurantCardImage
                    restaurant={restaurant}
                    hasImages={hasImages}
                    imageSrc={imageSrc}
                    imageCount={imageCount}
                    setShowEdit={setShowEdit}
                    setShowGallery={setShowGallery}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    isAuthenticated={auth.isAuthenticated}
                    isRefreshing={isRefreshing}
                    hasPlaceId={hasPlaceId}
                    handleRefreshHours={handleRefreshHours}
                    handleFindHours={handleFindHours}
                />
                <RestaurantCardContent
                    restaurant={restaurant}
                    hasLocation={hasLocation}
                    onShowHours={() => {
                        setShowHours(true)
                    }}
                />
                <RestaurantCardNotes notes={restaurant.notes} />
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
            <ImageGalleryModal images={imageUrls} show={showGallery} onOpenChange={setShowGallery} />
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

function RestaurantCardImage({
    restaurant,
    hasImages,
    imageSrc,
    imageCount,
    setShowEdit,
    setShowGallery,
    setShowDeleteConfirm,
    isAuthenticated,
    isRefreshing,
    hasPlaceId,
    handleRefreshHours,
    handleFindHours,
}: Readonly<{
    restaurant: Restaurant
    hasImages: boolean
    imageSrc: string | undefined
    imageCount: number
    setShowEdit: (show: boolean) => void
    setShowGallery: (show: boolean) => void
    setShowDeleteConfirm: (show: boolean) => void
    isAuthenticated: boolean
    isRefreshing: boolean
    hasPlaceId: boolean
    handleRefreshHours: () => void
    handleFindHours: () => void
}>) {
    return (
        <div className="relative aspect-2/1 w-full overflow-hidden">
            {hasImages ? (
                <>
                    <LazyImage
                        src={imageSrc}
                        alt={`${restaurant.name} - main image`}
                        aspectRatio="2/1"
                        loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                </>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-stone-200 to-stone-300">
                    <div className="flex items-center gap-2">
                        <Utensils className="size-5 text-stone-400" />
                        <span
                            className="text-xs tracking-wide text-stone-500 uppercase"
                            style={{ fontFamily: "var(--font-body)" }}
                        >
                            {restaurant.cuisine}
                        </span>
                    </div>
                </div>
            )}

            <div className="absolute top-3 left-3">
                <Badge variant="brand">
                    <Utensils className="mr-1 size-3" />
                    {restaurant.cuisine}
                </Badge>
            </div>

            {isAuthenticated && (
                <div className="absolute top-3 right-3 flex gap-1.5">
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
                </div>
            )}

            {hasImages && (
                <div className="absolute right-3 bottom-3">
                    <button
                        type="button"
                        onClick={() => {
                            setShowGallery(true)
                        }}
                        className="flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-medium text-stone-900 shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-surface"
                    >
                        <Images className="size-3.5" />
                        {imageCount > 1 ? <span>{imageCount} photos</span> : <span>View</span>}
                    </button>
                </div>
            )}
        </div>
    )
}

function RestaurantCardContent({
    restaurant,
    hasLocation,
    onShowHours,
}: Readonly<{
    restaurant: Restaurant
    hasLocation: boolean
    onShowHours: () => void
}>) {
    return (
        <div className="flex flex-col gap-4 p-5 md:gap-3 md:p-4">
            <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-3">
                    <h3
                        className="flex-1 leading-[1.1] font-semibold tracking-tight text-stone-900"
                        style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: "600" }}
                    >
                        {restaurant.name}
                    </h3>
                    {restaurant.link !== undefined && restaurant.link !== "" && (
                        <a
                            href={restaurant.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 items-center gap-1.5 rounded-full bg-tomato-50 px-3 py-1.5 text-xs font-medium text-tomato-700 transition-all duration-200 hover:bg-tomato-100"
                            title="View menu"
                        >
                            <Utensils className="size-3.5" />
                            <span>Menu</span>
                            <ExternalLink className="size-3 opacity-70" />
                        </a>
                    )}
                </div>
                <span className="text-xs text-stone-400">by {restaurant.addedBy}</span>
            </div>

            {(restaurant.location || restaurant.openingHours) && (
                <div className="flex flex-col gap-2.5 rounded-xl bg-stone-50/60 p-3">
                    {restaurant.location && (
                        <div className="flex items-center gap-2.5 text-sm text-stone-600">
                            <div className="flex size-6 items-center justify-center rounded-full bg-stone-100">
                                <MapPin className="size-3.5 text-stone-400" />
                            </div>
                            {hasLocation ? (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate transition-colors duration-200 hover:text-tomato-600"
                                >
                                    {restaurant.location}
                                </a>
                            ) : (
                                <span className="truncate">{restaurant.location}</span>
                            )}
                        </div>
                    )}
                    {restaurant.openingHours && (
                        <OpeningHours openingHours={restaurant.openingHours} onClick={onShowHours} />
                    )}
                </div>
            )}
        </div>
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
