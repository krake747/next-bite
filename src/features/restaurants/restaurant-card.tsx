import { useState } from "react"
import { Card } from "@ui/card"
import { Badge } from "@ui/badge"
import MapPin from "lucide-react/icons/map-pin"
import Utensils from "lucide-react/icons/utensils"
import ExternalLink from "lucide-react/icons/external-link"
import SquarePen from "lucide-react/icons/square-pen"
import Trash2 from "lucide-react/icons/trash-2"
import Images from "lucide-react/icons/images"
import ChevronDown from "lucide-react/icons/chevron-down"
import Navigation from "lucide-react/icons/navigation"
import RotateCcw from "lucide-react/icons/rotate-ccw"
import Search from "lucide-react/icons/search"
import { Map, AdvancedMarker } from "@vis.gl/react-google-maps"
import {
    useUpdateRestaurant,
    useDeleteRestaurant,
    useAuth,
    useRefreshOpeningHours,
    useLookupPlaceIdAndHours,
    type Restaurant,
} from "@core/hooks"
import { EditRestaurantDialog } from "./edit-restaurant-dialog"
import { EmojiRating } from "@ui/emoji-rating"
import { LazyImage } from "@ui/lazy-image"
import { ImageGalleryModal } from "@ui/image-gallery-modal"
import { OpeningHours } from "@ui/opening-hours"
import { OpeningHoursDialog } from "@ui/opening-hours-dialog"
import { Button } from "@ui/button"
import { Dialog } from "@base-ui/react/dialog"
import type { ComponentProps } from "react"

export function RestaurantCard({ restaurant, ...cardProps }: { restaurant: Restaurant } & ComponentProps<typeof Card>) {
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

    const hasPlaceId = !!restaurant.placeId

    const handleRefreshHours = async () => {
        setIsRefreshing(true)
        try {
            await refreshOpeningHours.mutateAsync({ restaurantId: restaurant._id })
        } catch {
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleFindHours = async () => {
        setIsRefreshing(true)
        try {
            await lookupPlaceIdAndHours.mutateAsync({ restaurantId: restaurant._id })
        } catch {
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleDelete = async () => {
        try {
            await deleteRestaurant.mutateAsync({ id: restaurant._id })
        } catch {}
    }

    const hasLocation = restaurant.lat != null && restaurant.lng != null
    const location: { lat: number; lng: number } | null = hasLocation
        ? { lat: restaurant.lat!, lng: restaurant.lng! }
        : null

    const hasImages = (restaurant.images?.length ?? 0) > 0
    const imageCount = restaurant.images?.length ?? 0
    const imageSrc = hasImages ? restaurant.images?.[0]?.url : undefined
    const imageUrls = restaurant.images?.map((img) => img.url) ?? []

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
                    onShowHours={() => setShowHours(true)}
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
}: {
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
}) {
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
                <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#f5f4f2] to-[#ebe9e6] dark:from-[#2d2b29] dark:to-[#262523]">
                    <div className="flex items-center gap-2">
                        <Utensils className="size-5 text-neutral-400 dark:text-neutral-500" />
                        <span
                            className="text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-500"
                            style={{ fontFamily: "var(--font-body)" }}
                        >
                            {restaurant.cuisine}
                        </span>
                    </div>
                </div>
            )}

            <div className="absolute top-3 left-3">
                <Badge variant="editorial">
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
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-neutral-900 hover:shadow-lg disabled:opacity-50"
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
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-neutral-900 hover:shadow-lg disabled:opacity-50"
                            title="Find hours"
                        >
                            <Search className="size-3.5" aria-hidden="true" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowEdit(true)}
                        aria-label="Edit restaurant"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-neutral-900 hover:shadow-lg"
                        title="Edit restaurant"
                    >
                        <SquarePen className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        aria-label="Delete restaurant"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-red-50 hover:text-red-700 hover:shadow-lg"
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
                        onClick={() => setShowGallery(true)}
                        className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-900 shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white"
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
}: {
    restaurant: Restaurant
    hasLocation: boolean
    onShowHours: () => void
}) {
    return (
        <div className="flex flex-col gap-4 p-5 md:gap-3 md:p-4">
            <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-3">
                    <h3
                        className="flex-1 leading-[1.1] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
                        style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: "600" }}
                    >
                        {restaurant.name}
                    </h3>
                    {restaurant.link && (
                        <a
                            href={restaurant.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex shrink-0 items-center gap-1.5 rounded-full bg-flame-pea-50 px-3 py-1.5 text-xs font-medium text-flame-pea-700 transition-all duration-200 hover:bg-flame-pea-100 dark:bg-flame-pea-950/30 dark:text-flame-pea-400 dark:hover:bg-flame-pea-900/40"
                            title="View menu"
                        >
                            <Utensils className="size-3.5" />
                            <span>Menu</span>
                            <ExternalLink className="size-3 opacity-70" />
                        </a>
                    )}
                </div>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">by {restaurant.addedBy}</span>
            </div>

            {(restaurant.location || restaurant.openingHours) && (
                <div className="flex flex-col gap-2.5 rounded-xl bg-neutral-50/60 p-3 dark:bg-neutral-800/40">
                    {restaurant.location && (
                        <div className="flex items-center gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                            <div className="flex size-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-700">
                                <MapPin className="size-3.5 text-neutral-400 dark:text-neutral-500" />
                            </div>
                            {hasLocation ? (
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate transition-colors duration-200 hover:text-flame-pea-600 dark:hover:text-flame-pea-400"
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

function RestaurantCardNotes({ notes }: { notes: string | null | undefined }) {
    if (!notes) return null
    return (
        <div className="px-5 pb-2 md:px-4">
            <div className="relative">
                <div
                    className="absolute -top-1 left-2 font-serif text-5xl leading-none text-flame-pea-400/30 select-none dark:text-flame-pea-600/20"
                    style={{ fontFamily: "var(--font-display)" }}
                    aria-hidden="true"
                >
                    "
                </div>
                <div className="border-l-2 border-flame-pea-400/50 bg-flame-pea-50/30 py-3 pr-3 pl-5 dark:border-flame-pea-600/40 dark:bg-flame-pea-950/15">
                    <p
                        className="text-sm leading-relaxed text-neutral-700 italic dark:text-neutral-300"
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
}: {
    showMap: boolean
    setShowMap: (show: boolean) => void
    location: { lat: number; lng: number }
    directionsUrl: string
    restaurant: Restaurant
}) {
    return (
        <div className="px-5 md:px-4">
            <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className="group/trigger flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm text-neutral-600 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:border-white/8 dark:hover:bg-white/3"
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-neutral-100 transition-colors duration-200 group-hover/trigger:bg-flame-pea-100 dark:bg-neutral-800 dark:group-hover/trigger:bg-flame-pea-950/40">
                        <Navigation className="size-3.5 text-neutral-500 transition-colors duration-200 group-hover/trigger:text-flame-pea-600 dark:text-neutral-500 dark:group-hover/trigger:text-flame-pea-400" />
                    </div>
                    <span className="font-medium">View on Map</span>
                </div>
                <ChevronDown
                    className={`size-4 text-neutral-400 transition-transform duration-300 ease-out dark:text-neutral-500 ${showMap ? "rotate-180" : ""}`}
                />
            </button>
            {showMap && (
                <div>
                    <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-neutral-200 shadow-inner transition-shadow duration-200 hover:shadow-md dark:border-white/8"
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
                    <p className="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-500">
                        Click map to get directions
                    </p>
                </div>
            )}
        </div>
    )
}

function RestaurantCardRating({
    rating,
    onRate,
}: {
    rating: number | null
    onRate: (rating: number) => void | Promise<void>
}) {
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
}: {
    show: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    restaurantName: string
}) {
    return (
        <Dialog.Root open={show} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Popup className="relative w-full max-w-sm rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/10 dark:bg-neutral-900">
                        <Dialog.Title
                            className="text-lg font-semibold text-neutral-900 dark:text-white"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Delete restaurant
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            Are you sure you want to delete{" "}
                            <strong className="text-neutral-900 dark:text-neutral-100">{restaurantName}</strong>? This
                            action cannot be undone.
                        </Dialog.Description>
                        <div className="mt-6 flex justify-end gap-2">
                            <Dialog.Close
                                render={
                                    <Button variant="secondary" size="md">
                                        Cancel
                                    </Button>
                                }
                            />
                            <Button
                                variant="primary"
                                size="md"
                                className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                                onClick={() => {
                                    onConfirm()
                                    onOpenChange(false)
                                }}
                            >
                                Delete
                            </Button>
                        </div>
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
