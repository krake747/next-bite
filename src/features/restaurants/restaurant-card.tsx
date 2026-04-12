import { createSignal, splitProps, Show } from "solid-js"
import { Card, CardFooter } from "../../ui/card"
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
    const imageSrc = () => (hasImages() ? local.restaurant.images?.[0] : undefined)

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
                {/* Image Section - Refined aspect ratio with elegant overlay */}
                <div class="relative aspect-[4/3] w-full overflow-hidden">
                    <Show
                        when={hasImages()}
                        fallback={
                            <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#f5f4f2] to-[#ebe9e6] dark:from-[#2d2b29] dark:to-[#262523]">
                                <div class="text-center">
                                    <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white/60 shadow-sm backdrop-blur-sm dark:bg-white/5">
                                        <Utensils class="size-7 text-neutral-400 dark:text-neutral-500" />
                                    </div>
                                    <p
                                        class="text-sm tracking-wide text-neutral-500 uppercase dark:text-neutral-500"
                                        style={{ "font-family": "var(--font-body)" }}
                                    >
                                        {local.restaurant.cuisine}
                                    </p>
                                </div>
                            </div>
                        }
                    >
                        <LazyImage
                            src={imageSrc()}
                            alt={`${local.restaurant.name} - main image`}
                            aspectRatio="4/3"
                            loading="lazy"
                        />
                        {/* Elegant gradient overlay */}
                        <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </Show>

                    {/* Cuisine Badge - Top left */}
                    <div class="absolute top-4 left-4">
                        <Badge variant="editorial">
                            <Utensils class="mr-1.5 size-3" />
                            {local.restaurant.cuisine}
                        </Badge>
                    </div>

                    {/* Photo gallery button - Static, no scale animations */}
                    <Show when={hasImages()}>
                        <div class="absolute right-4 bottom-4">
                            <button
                                type="button"
                                onClick={() => setShowGallery(true)}
                                class="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium text-neutral-900 shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white"
                            >
                                <Images class="size-4" />
                                <Show when={imageCount() > 1} fallback={<span class="text-xs">View</span>}>
                                    <span class="text-xs">{imageCount()} photos</span>
                                </Show>
                            </button>
                        </div>
                    </Show>
                </div>

                {/* Content Section - Refined spacing and typography */}
                <div class="flex flex-col gap-5 p-6">
                    {/* Header - Name and Menu Link */}
                    <div class="flex flex-col gap-3">
                        <div class="flex items-start justify-between gap-4">
                            <h3
                                class="flex-1 leading-[1.15] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
                                style={{
                                    "font-family": "var(--font-display)",
                                    "font-size": "28px",
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
                                    class="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors duration-200 hover:border-flame-pea-300 hover:bg-flame-pea-50 hover:text-flame-pea-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:border-flame-pea-700 dark:hover:bg-flame-pea-950/30 dark:hover:text-flame-pea-400"
                                    title="View menu"
                                >
                                    <span>Menu</span>
                                    <ExternalLink class="size-3" />
                                </a>
                            </Show>
                        </div>

                        {/* Location */}
                        <div class="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <MapPin class="mt-0.5 size-4 shrink-0 text-neutral-400 dark:text-neutral-500" />
                            <Show when={hasLocation()} fallback={local.restaurant.location}>
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
                    </div>

                    {/* Notes */}
                    <Show when={local.restaurant.notes}>
                        <div class="border-l-2 border-neutral-200 pl-4 dark:border-neutral-700">
                            <p
                                class={`leading-relaxed text-neutral-600 dark:text-neutral-400 ${
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
                                    class="mt-2 text-sm font-medium text-flame-pea-700 transition-colors duration-200 hover:text-flame-pea-600 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
                                >
                                    {notesExpanded() ? "Show less" : "Read more"}
                                </button>
                            </Show>
                        </div>
                    </Show>

                    {/* Rating Section */}
                    <div class="rounded-xl border border-neutral-100 bg-gradient-to-b from-white to-neutral-50/80 p-5 dark:border-white/[0.06] dark:from-white/[0.03] dark:to-transparent">
                        <EmojiRating rating={local.restaurant.rating ?? null} onRate={handleRate} />
                    </div>

                    {/* Map Section */}
                    <Show when={hasLocation()}>
                        <Collapsible open={showMap()} onOpenChange={setShowMap}>
                            <Collapsible.Trigger class="group/trigger flex w-full items-center justify-between rounded-xl border border-transparent px-4 py-3 text-sm text-neutral-600 transition-all duration-200 hover:border-neutral-200 hover:bg-neutral-50 dark:text-neutral-400 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.03]">
                                <div class="flex items-center gap-3">
                                    <div class="flex size-8 items-center justify-center rounded-full bg-neutral-100 transition-colors duration-200 group-hover/trigger:bg-flame-pea-100 dark:bg-neutral-800 dark:group-hover/trigger:bg-flame-pea-950/40">
                                        <Navigation class="size-4 text-neutral-500 transition-colors duration-200 group-hover/trigger:text-flame-pea-600 dark:text-neutral-500 dark:group-hover/trigger:text-flame-pea-400" />
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
                                    class="mt-3 aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-neutral-200 shadow-inner transition-shadow duration-200 hover:shadow-md dark:border-white/[0.08]"
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
                </div>

                {/* Footer */}
                <CardFooter class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-neutral-500 dark:text-neutral-500">Added by</span>
                        <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-200">
                            {local.restaurant.addedBy}
                        </span>
                    </div>
                    <Show when={auth.isAuthenticated()}>
                        <button
                            type="button"
                            onClick={() => setShowEdit(true)}
                            aria-label="Edit restaurant"
                            class="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-neutral-400 transition-colors duration-200 hover:border-neutral-200 hover:bg-white hover:text-neutral-700 dark:text-neutral-500 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.05] dark:hover:text-neutral-300"
                            title="Edit restaurant"
                        >
                            <SquarePen class="size-4" aria-hidden="true" />
                        </button>
                    </Show>
                </CardFooter>
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
