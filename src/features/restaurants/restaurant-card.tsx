import { createSignal, splitProps, Show, createMemo } from "solid-js"
import { Card } from "@ui/card"
import { Badge } from "@ui/badge"
import MapPin from "lucide-solid/icons/map-pin"
import Utensils from "lucide-solid/icons/utensils"
import ExternalLink from "lucide-solid/icons/external-link"
import SquarePen from "lucide-solid/icons/square-pen"
import Images from "lucide-solid/icons/images"
import ChevronDown from "lucide-solid/icons/chevron-down"
import Navigation from "lucide-solid/icons/navigation"
import RotateCcw from "lucide-solid/icons/rotate-ccw"
import Search from "lucide-solid/icons/search"
import { Collapsible } from "@kobalte/core/collapsible"
import { Map, AdvancedMarker } from "solid-google-maps"
import {
    useUpdateRestaurant,
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
import type { ComponentProps } from "solid-js"

export function RestaurantCard(props: { restaurant: Restaurant } & ComponentProps<typeof Card>) {
    const [local, cardProps] = splitProps(props, ["restaurant"])
    const [showEdit, setShowEdit] = createSignal(false)
    const [showGallery, setShowGallery] = createSignal(false)
    const [showMap, setShowMap] = createSignal(false)
    const [notesExpanded, setNotesExpanded] = createSignal(false)
    const [showHours, setShowHours] = createSignal(false)
    const [isRefreshing, setIsRefreshing] = createSignal(false)
    const updateRestaurant = useUpdateRestaurant()
    const auth = useAuth()
    const refreshOpeningHours = useRefreshOpeningHours()
    const lookupPlaceIdAndHours = useLookupPlaceIdAndHours()

    const hasPlaceId = () => !!local.restaurant.placeId

    const handleRefreshHours = async () => {
        setIsRefreshing(true)
        try {
            await refreshOpeningHours({ restaurantId: local.restaurant._id })
        } catch {
            // Silent fail
        } finally {
            setIsRefreshing(false)
        }
    }

    const handleFindHours = async () => {
        setIsRefreshing(true)
        try {
            await lookupPlaceIdAndHours({ restaurantId: local.restaurant._id })
        } catch {
            // Silent fail
        } finally {
            setIsRefreshing(false)
        }
    }

    const hasLocation = () => local.restaurant.lat != null && local.restaurant.lng != null
    const hasImages = () => (local.restaurant.images?.length ?? 0) > 0
    const imageCount = () => local.restaurant.images?.length ?? 0
    const imageSrc = createMemo(() => (hasImages() ? local.restaurant.images?.[0]?.url : undefined))
    const imageUrls = createMemo(() => local.restaurant.images?.map((img) => img.url) ?? [])

    const location = createMemo(() =>
        hasLocation() ? ({ lat: local.restaurant.lat, lng: local.restaurant.lng } as const) : undefined,
    )

    const handleRate = async (rating: number) => {
        await updateRestaurant({ id: local.restaurant._id, rating })
    }

    const directionsUrl = () => {
        const loc = location()
        if (!loc) return undefined
        return `https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`
    }

    return (
        <>
            <Card {...cardProps}>
                <RestaurantCardImage
                    restaurant={local.restaurant}
                    hasImages={hasImages()}
                    imageSrc={imageSrc()}
                    imageCount={imageCount()}
                    showEdit={showEdit()}
                    setShowEdit={setShowEdit}
                    setShowGallery={setShowGallery}
                    isAuthenticated={auth.isAuthenticated()}
                    isRefreshing={isRefreshing()}
                    hasPlaceId={hasPlaceId()}
                    handleRefreshHours={handleRefreshHours}
                    handleFindHours={handleFindHours}
                />
                <RestaurantCardContent restaurant={local.restaurant} hasLocation={hasLocation()} />
                <RestaurantCardNotes
                    notes={local.restaurant.notes}
                    notesExpanded={notesExpanded()}
                    setNotesExpanded={setNotesExpanded}
                />
                <Show when={hasLocation()}>
                    <RestaurantCardMap
                        showMap={showMap()}
                        setShowMap={setShowMap}
                        location={(location() as { lat: number; lng: number })!}
                        directionsUrl={directionsUrl()!}
                        restaurant={local.restaurant}
                    />
                </Show>
                <RestaurantCardRating rating={local.restaurant.rating ?? null} onRate={handleRate} />
            </Card>

            <EditRestaurantDialog show={showEdit()} onOpenChange={setShowEdit} restaurant={local.restaurant} />
            <ImageGalleryModal images={imageUrls()} show={showGallery()} onOpenChange={setShowGallery} />
            <OpeningHoursDialog
                show={showHours()}
                onOpenChange={setShowHours}
                openingHours={local.restaurant.openingHours}
                restaurantName={local.restaurant.name}
            />
        </>
    )
}

function RestaurantCardImage(props: {
    restaurant: Restaurant
    hasImages: boolean
    imageSrc: string | undefined
    imageCount: number
    showEdit: boolean
    setShowEdit: (show: boolean) => void
    setShowGallery: (show: boolean) => void
    isAuthenticated: boolean
    isRefreshing: boolean
    hasPlaceId: boolean
    handleRefreshHours: () => void
    handleFindHours: () => void
}) {
    return (
        <div class="relative aspect-2/1 w-full overflow-hidden">
            <Show
                when={props.hasImages}
                fallback={
                    <div class="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#f5f4f2] to-[#ebe9e6] dark:from-[#2d2b29] dark:to-[#262523]">
                        <div class="flex items-center gap-2">
                            <Utensils class="size-5 text-neutral-400 dark:text-neutral-500" />
                            <span
                                class="text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-500"
                                style={{ "font-family": "var(--font-body)" }}
                            >
                                {props.restaurant.cuisine}
                            </span>
                        </div>
                    </div>
                }
            >
                <LazyImage
                    src={props.imageSrc}
                    alt={`${props.restaurant.name} - main image`}
                    aspectRatio="2/1"
                    loading="lazy"
                />
                <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            </Show>

            <div class="absolute top-3 left-3">
                <Badge variant="editorial">
                    <Utensils class="mr-1 size-3" />
                    {props.restaurant.cuisine}
                </Badge>
            </div>

            <Show when={props.isAuthenticated}>
                <div class="absolute top-3 right-3 flex gap-1.5">
                    <Show when={props.hasPlaceId}>
                        <button
                            type="button"
                            onClick={props.handleRefreshHours}
                            disabled={props.isRefreshing}
                            aria-label="Refresh hours"
                            class="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-neutral-900 hover:shadow-lg disabled:opacity-50"
                            title="Refresh hours"
                        >
                            <RotateCcw class="size-3.5" aria-hidden="true" />
                        </button>
                    </Show>
                    <Show when={!props.hasPlaceId}>
                        <button
                            type="button"
                            onClick={props.handleFindHours}
                            disabled={props.isRefreshing}
                            aria-label="Find hours"
                            class="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-neutral-900 hover:shadow-lg disabled:opacity-50"
                            title="Find hours"
                        >
                            <Search class="size-3.5" aria-hidden="true" />
                        </button>
                    </Show>
                    <button
                        type="button"
                        onClick={() => props.setShowEdit(true)}
                        aria-label="Edit restaurant"
                        class="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-neutral-900 hover:shadow-lg"
                        title="Edit restaurant"
                    >
                        <SquarePen class="size-3.5" aria-hidden="true" />
                    </button>
                </div>
            </Show>

            <Show when={props.hasImages}>
                <div class="absolute right-3 bottom-3">
                    <button
                        type="button"
                        onClick={() => props.setShowGallery(true)}
                        class="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-900 shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white"
                    >
                        <Images class="size-3.5" />
                        <Show when={props.imageCount > 1} fallback={<span>View</span>}>
                            <span>{props.imageCount} photos</span>
                        </Show>
                    </button>
                </div>
            </Show>

            <div class="absolute bottom-3 left-3">
                <span class="text-xs text-white/80 drop-shadow-md">
                    by <span class="font-medium text-white">{props.restaurant.addedBy}</span>
                </span>
            </div>
        </div>
    )
}

function RestaurantCardContent(props: { restaurant: Restaurant; hasLocation: boolean }) {
    return (
        <div class="flex flex-col gap-4 p-5 md:gap-3 md:p-4">
            <div class="flex flex-col gap-2.5 md:gap-2">
                <div class="flex items-start justify-between gap-3">
                    <h3
                        class="flex-1 leading-[1.15] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
                        style={{
                            "font-family": "var(--font-display)",
                            "font-size": "20px",
                            "font-weight": "600",
                        }}
                    >
                        {props.restaurant.name}
                    </h3>
                    <Show when={props.restaurant.link}>
                        <a
                            href={props.restaurant.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-600 backdrop-blur-sm transition-all duration-200 hover:border-flame-pea-300 hover:bg-flame-pea-50/80 hover:text-flame-pea-700 dark:border-neutral-700/80 dark:bg-neutral-800/80 dark:text-neutral-400 dark:hover:border-flame-pea-700 dark:hover:bg-flame-pea-950/30 dark:hover:text-flame-pea-400"
                            title="View menu"
                        >
                            <span>Menu</span>
                            <ExternalLink class="size-3" />
                        </a>
                    </Show>
                </div>

                <Show when={props.restaurant.location}>
                    <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                        <div class="flex size-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <MapPin class="size-3.5 text-neutral-400 dark:text-neutral-500" />
                        </div>
                        <Show
                            when={props.hasLocation}
                            fallback={<span class="truncate">{props.restaurant.location}</span>}
                        >
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.restaurant.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="truncate transition-colors duration-200 hover:text-flame-pea-600 dark:hover:text-flame-pea-400"
                            >
                                {props.restaurant.location}
                            </a>
                        </Show>
                    </div>
                </Show>
                <Show when={props.restaurant.openingHours}>
                    <OpeningHours openingHours={props.restaurant.openingHours} onClick={() => setShowHours(true)} />
                </Show>
            </div>
        </div>
    )
}

function RestaurantCardNotes(props: {
    notes: string | null | undefined
    notesExpanded: boolean
    setNotesExpanded: (expanded: boolean) => void
}) {
    return (
        <Show when={props.notes}>
            <div class="px-5 md:px-4">
                <div class="relative">
                    <div
                        class="absolute -top-1 left-2 font-serif text-4xl leading-none text-flame-pea-300/40 select-none dark:text-flame-pea-700/30"
                        style={{ "font-family": "Georgia, serif" }}
                        aria-hidden="true"
                    >
                        "
                    </div>
                    <div class="border-l-2 border-flame-pea-300/60 bg-linear-to-r from-flame-pea-50/50 to-transparent py-2 pr-3 pl-6 dark:border-flame-pea-700/40 dark:from-flame-pea-950/20">
                        <p
                            class={`text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 ${
                                props.notesExpanded ? "" : "line-clamp-2"
                            }`}
                            style={{ "font-family": "var(--font-body)" }}
                        >
                            {props.notes}
                        </p>
                        <Show when={(props.notes?.length ?? 0) > 100}>
                            <button
                                type="button"
                                onClick={() => props.setNotesExpanded(!props.notesExpanded)}
                                class="mt-1.5 text-xs font-medium text-flame-pea-700 transition-colors duration-200 hover:text-flame-pea-600 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
                            >
                                {props.notesExpanded ? "Show less" : "Read more"}
                            </button>
                        </Show>
                    </div>
                </div>
            </div>
        </Show>
    )
}

function RestaurantCardMap(props: {
    showMap: boolean
    setShowMap: (show: boolean) => void
    location: { lat: number; lng: number }
    directionsUrl: string
    restaurant: Restaurant
}) {
    return (
        <div class="px-5 md:px-4">
            <Collapsible open={props.showMap} onOpenChange={props.setShowMap}>
                <Collapsible.Trigger class="group/trigger flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm text-neutral-600 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:border-white/8 dark:hover:bg-white/3">
                    <div class="flex items-center gap-3">
                        <div class="flex size-7 items-center justify-center rounded-full bg-neutral-100 transition-colors duration-200 group-hover/trigger:bg-flame-pea-100 dark:bg-neutral-800 dark:group-hover/trigger:bg-flame-pea-950/40">
                            <Navigation class="size-3.5 text-neutral-500 transition-colors duration-200 group-hover/trigger:text-flame-pea-600 dark:text-neutral-500 dark:group-hover/trigger:text-flame-pea-400" />
                        </div>
                        <span class="font-medium">View on Map</span>
                    </div>
                    <ChevronDown
                        class="size-4 text-neutral-400 transition-transform duration-300 ease-out dark:text-neutral-500"
                        classList={{ "rotate-180": props.showMap }}
                    />
                </Collapsible.Trigger>
                <Collapsible.Content>
                    <a
                        href={props.directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mt-2 block aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-neutral-200 shadow-inner transition-shadow duration-200 hover:shadow-md dark:border-white/8"
                        title="Get directions"
                    >
                        <Map
                            center={props.location}
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
                            <AdvancedMarker position={props.location} title={props.restaurant.name ?? null} />
                        </Map>
                    </a>
                    <p class="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-500">
                        Click map to get directions
                    </p>
                </Collapsible.Content>
            </Collapsible>
        </div>
    )
}

function RestaurantCardRating(props: { rating: number | null; onRate: (rating: number) => void | Promise<void> }) {
    return (
        <div class="px-5 py-2 md:px-4 md:py-2">
            <EmojiRating rating={props.rating} onRate={props.onRate} />
        </div>
    )
}
