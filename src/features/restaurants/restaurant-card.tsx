import { createSignal, splitProps, Show, createMemo } from "solid-js"
import { Card } from "../../ui/card"
import { Badge } from "../../ui/badge"
import MapPin from "lucide-solid/icons/map-pin"
import Utensils from "lucide-solid/icons/utensils"
import ExternalLink from "lucide-solid/icons/external-link"
import SquarePen from "lucide-solid/icons/square-pen"
import Images from "lucide-solid/icons/images"
import ChevronDown from "lucide-solid/icons/chevron-down"
import Navigation from "lucide-solid/icons/navigation"
import { Collapsible } from "@kobalte/core/collapsible"
import { Map, AdvancedMarker } from "solid-google-maps"
import { useUpdateRestaurant, useAuth, type Restaurant } from "../../core/hooks"
import { EditRestaurantDialog } from "./edit-restaurant-dialog"
import { EmojiRating } from "../../ui/emoji-rating"
import { LazyImage } from "../../ui/lazy-image"
import { ImageGalleryModal } from "../../ui/image-gallery-modal"
import type { ComponentProps } from "solid-js"

export function RestaurantCard(props: { restaurant: Restaurant } & ComponentProps<typeof Card>) {
    const [local, cardProps] = splitProps(props, ["restaurant"])
    const [showEdit, setShowEdit] = createSignal(false)
    const [showGallery, setShowGallery] = createSignal(false)
    const [showMap, setShowMap] = createSignal(false)
    const [notesExpanded, setNotesExpanded] = createSignal(false)
    const updateRestaurant = useUpdateRestaurant()
    const auth = useAuth()

    const hasLocation = () => local.restaurant.lat != null && local.restaurant.lng != null
    const hasImages = () => (local.restaurant.images?.length ?? 0) > 0
    const imageCount = () => local.restaurant.images?.length ?? 0
    // Memoize image URL to prevent flicker when rating updates
    const imageSrc = createMemo(() => (hasImages() ? local.restaurant.images?.[0] : undefined))

    const handleRate = async (rating: number) => {
        await updateRestaurant({ id: local.restaurant._id, rating })
    }

    const openDirections = () => {
        if (!hasLocation()) return
        const url = `https://www.google.com/maps/dir/?api=1&destination=${local.restaurant.lat},${local.restaurant.lng}`
        window.open(url, "_blank")
    }

    return (
        <>
            <Card {...cardProps}>
                {/* Image Section - 2:1 ultra-wide for compact cards */}
                <div class="relative aspect-[2/1] w-full overflow-hidden">
                    <Show
                        when={hasImages()}
                        fallback={
                            <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f5f4f2] to-[#ebe9e6] dark:from-[#2d2b29] dark:to-[#262523]">
                                <div class="flex items-center gap-2">
                                    <Utensils class="size-5 text-neutral-400 dark:text-neutral-500" />
                                    <span
                                        class="text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-500"
                                        style={{ "font-family": "var(--font-body)" }}
                                    >
                                        {local.restaurant.cuisine}
                                    </span>
                                </div>
                            </div>
                        }
                    >
                        <LazyImage
                            src={imageSrc()}
                            alt={`${local.restaurant.name} - main image`}
                            aspectRatio="2/1"
                            loading="lazy"
                        />
                        {/* Elegant gradient overlay */}
                        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </Show>

                    {/* Cuisine Badge - Top left */}
                    <div class="absolute top-3 left-3">
                        <Badge variant="editorial">
                            <Utensils class="mr-1 size-3" />
                            {local.restaurant.cuisine}
                        </Badge>
                    </div>

                    {/* Edit button - Top right, only for authenticated users */}
                    <Show when={auth.isAuthenticated()}>
                        <div class="absolute top-3 right-3">
                            <button
                                type="button"
                                onClick={() => setShowEdit(true)}
                                aria-label="Edit restaurant"
                                class="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-neutral-600 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-neutral-900 hover:shadow-lg"
                                title="Edit restaurant"
                            >
                                <SquarePen class="size-3.5" aria-hidden="true" />
                            </button>
                        </div>
                    </Show>

                    {/* Photo gallery button */}
                    <Show when={hasImages()}>
                        <div class="absolute right-3 bottom-3">
                            <button
                                type="button"
                                onClick={() => setShowGallery(true)}
                                class="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-neutral-900 shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white"
                            >
                                <Images class="size-3.5" />
                                <Show when={imageCount() > 1} fallback={<span>View</span>}>
                                    <span>{imageCount()} photos</span>
                                </Show>
                            </button>
                        </div>
                    </Show>

                    {/* Added by - Bottom left overlay */}
                    <div class="absolute bottom-3 left-3">
                        <span class="text-xs text-white/80 drop-shadow-md">
                            by <span class="font-medium text-white">{local.restaurant.addedBy}</span>
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div class="flex flex-col gap-4 p-5 md:gap-3 md:p-4">
                    {/* Header - Name and Menu Link */}
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
                                {local.restaurant.name}
                            </h3>
                            <Show when={local.restaurant.link}>
                                <a
                                    href={local.restaurant.link}
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

                        {/* Location with subtle styling */}
                        <Show when={local.restaurant.location}>
                            <div class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                                <div class="flex size-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    <MapPin class="size-3.5 text-neutral-400 dark:text-neutral-500" />
                                </div>
                                <Show
                                    when={hasLocation()}
                                    fallback={<span class="truncate">{local.restaurant.location}</span>}
                                >
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.restaurant.location)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        class="truncate transition-colors duration-200 hover:text-flame-pea-600 dark:hover:text-flame-pea-400"
                                    >
                                        {local.restaurant.location}
                                    </a>
                                </Show>
                            </div>
                        </Show>
                    </div>

                    {/* Notes - styled as an elegant quote */}
                    <Show when={local.restaurant.notes}>
                        <div class="relative">
                            {/* Decorative quote mark */}
                            <div
                                class="absolute -top-1 left-2 font-serif text-4xl leading-none text-flame-pea-300/40 select-none dark:text-flame-pea-700/30"
                                style={{ "font-family": "Georgia, serif" }}
                                aria-hidden="true"
                            >
                                "
                            </div>
                            <div class="border-l-2 border-flame-pea-300/60 bg-gradient-to-r from-flame-pea-50/50 to-transparent py-2 pr-3 pl-6 dark:border-flame-pea-700/40 dark:from-flame-pea-950/20">
                                <p
                                    class={`text-sm leading-relaxed text-neutral-700 dark:text-neutral-300 ${
                                        notesExpanded() ? "" : "line-clamp-2"
                                    }`}
                                    style={{ "font-family": "var(--font-body)" }}
                                >
                                    {local.restaurant.notes}
                                </p>
                                <Show when={(local.restaurant.notes?.length ?? 0) > 100}>
                                    <button
                                        type="button"
                                        onClick={() => setNotesExpanded(!notesExpanded())}
                                        class="mt-1.5 text-xs font-medium text-flame-pea-700 transition-colors duration-200 hover:text-flame-pea-600 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
                                    >
                                        {notesExpanded() ? "Show less" : "Read more"}
                                    </button>
                                </Show>
                            </div>
                        </div>
                    </Show>

                    {/* Map Section */}
                    <Show when={hasLocation()}>
                        <Collapsible open={showMap()} onOpenChange={setShowMap}>
                            <Collapsible.Trigger class="group/trigger flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm text-neutral-600 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.03]">
                                <div class="flex items-center gap-3">
                                    <div class="flex size-7 items-center justify-center rounded-full bg-neutral-100 transition-colors duration-200 group-hover/trigger:bg-flame-pea-100 dark:bg-neutral-800 dark:group-hover/trigger:bg-flame-pea-950/40">
                                        <Navigation class="size-3.5 text-neutral-500 transition-colors duration-200 group-hover/trigger:text-flame-pea-600 dark:text-neutral-500 dark:group-hover/trigger:text-flame-pea-400" />
                                    </div>
                                    <span class="font-medium">View on Map</span>
                                </div>
                                <ChevronDown
                                    class="size-4 text-neutral-400 transition-transform duration-300 ease-out dark:text-neutral-500"
                                    classList={{ "rotate-180": showMap() }}
                                />
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <div
                                    class="mt-2 aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-neutral-200 shadow-inner transition-shadow duration-200 hover:shadow-md dark:border-white/[0.08]"
                                    onClick={openDirections}
                                    title="Get directions"
                                >
                                    <Map
                                        center={{ lat: local.restaurant.lat!, lng: local.restaurant.lng! }}
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
                                        <AdvancedMarker
                                            position={{ lat: local.restaurant.lat!, lng: local.restaurant.lng! }}
                                            title={local.restaurant.name ?? null}
                                        />
                                    </Map>
                                </div>
                                <p class="mt-2 text-center text-xs text-neutral-500 dark:text-neutral-500">
                                    Click map to get directions
                                </p>
                            </Collapsible.Content>
                        </Collapsible>
                    </Show>

                    {/* Rating Section */}
                    <div class="py-2">
                        <EmojiRating rating={local.restaurant.rating ?? null} onRate={handleRate} />
                    </div>
                </div>
            </Card>

            <EditRestaurantDialog show={showEdit()} onOpenChange={setShowEdit} restaurant={local.restaurant} />
            <ImageGalleryModal
                images={local.restaurant.images ?? []}
                show={showGallery()}
                onOpenChange={setShowGallery}
            />
        </>
    )
}
