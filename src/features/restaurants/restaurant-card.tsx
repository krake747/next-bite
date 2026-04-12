import { createSignal, splitProps, Show } from "solid-js"
import { Card, CardFooter } from "../../ui/card"
import { Badge } from "../../ui/badge"
import MapPin from "lucide-solid/icons/map-pin"
import Utensils from "lucide-solid/icons/utensils"
import ExternalLink from "lucide-solid/icons/external-link"
import SquarePen from "lucide-solid/icons/square-pen"
import Images from "lucide-solid/icons/images"
import ChevronDown from "lucide-solid/icons/chevron-down"
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
                <div class="relative aspect-video w-full overflow-hidden rounded-t-xl">
                    <Show
                        when={hasImages()}
                        fallback={
                            <div class="absolute inset-0 flex items-center justify-center bg-[#f5f4f2] dark:bg-[#2d2b29]">
                                <div class="text-center">
                                    <Utensils class="mx-auto mb-2 size-12 text-neutral-300 dark:text-neutral-600" />
                                    <p class="text-sm font-medium text-neutral-400 dark:text-neutral-500">
                                        {local.restaurant.cuisine}
                                    </p>
                                </div>
                            </div>
                        }
                    >
                        <LazyImage
                            src={imageSrc()}
                            alt={`${local.restaurant.name} - main image`}
                            aspectRatio="16/9"
                            loading="lazy"
                        />
                        <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                    </Show>
                    <div class="absolute top-4 right-4">
                        <Badge variant="editorial">
                            <Utensils class="mr-1.5 size-3.5" />
                            {local.restaurant.cuisine}
                        </Badge>
                    </div>
                    <Show when={hasImages()}>
                        <Show
                            when={imageCount() > 1}
                            fallback={
                                <div class="absolute right-4 bottom-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowGallery(true)}
                                        class="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-neutral-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                                    >
                                        <Images class="size-4" />
                                        View
                                    </button>
                                </div>
                            }
                        >
                            <div class="absolute right-4 bottom-4">
                                <button
                                    type="button"
                                    onClick={() => setShowGallery(true)}
                                    class="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-neutral-900 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                                >
                                    <Images class="size-4" />
                                    {imageCount()} photos
                                </button>
                            </div>
                        </Show>
                    </Show>
                </div>

                <div class="flex flex-col gap-5 p-6">
                    <div class="flex flex-col gap-2">
                        <div class="flex items-center justify-between gap-3">
                            <h3
                                class="leading-tight font-semibold"
                                style={{
                                    "font-family": "var(--font-display)",
                                    "font-size": "26px",
                                }}
                            >
                                {local.restaurant.name}
                            </h3>
                            <Show when={local.restaurant.link}>
                                <a
                                    href={local.restaurant.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex shrink-0 items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-flame-pea-100 hover:text-flame-pea-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-flame-pea-900/30 dark:hover:text-flame-pea-400"
                                    title="View menu"
                                >
                                    <ExternalLink class="size-3.5" />
                                    Menu
                                </a>
                            </Show>
                        </div>
                        <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                            <MapPin class="size-4 shrink-0" />
                            <Show when={hasLocation()} fallback={local.restaurant.location}>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.restaurant.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="truncate hover:text-flame-pea-600 hover:underline dark:hover:text-flame-pea-400"
                                >
                                    {local.restaurant.location}
                                </a>
                            </Show>
                        </div>
                    </div>

                    <Show when={local.restaurant.notes}>
                        <div class="h-12">
                            <p
                                class={`leading-relaxed text-neutral-600 dark:text-neutral-400 ${
                                    notesExpanded() ? "" : "line-clamp-2"
                                }`}
                            >
                                {local.restaurant.notes}
                            </p>
                            <Show when={(local.restaurant.notes?.length ?? 0) > 80}>
                                <button
                                    type="button"
                                    onClick={() => setNotesExpanded(!notesExpanded())}
                                    class="mt-1 text-sm font-medium text-flame-pea-700 transition-colors hover:text-flame-pea-600 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
                                >
                                    {notesExpanded() ? "Show less" : "Read more"}
                                </button>
                            </Show>
                        </div>
                    </Show>

                    <div class="rounded-lg bg-neutral-50/80 p-4 dark:bg-white/5">
                        <EmojiRating rating={local.restaurant.rating ?? null} onRate={handleRate} />
                    </div>

                    <div class="flex flex-col gap-2">
                        <Show when={hasLocation()}>
                            <Collapsible open={showMap()} onOpenChange={setShowMap}>
                                <Collapsible.Trigger class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-neutral-600 transition-colors duration-150 ease hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100">
                                    <div class="flex items-center gap-2">
                                        <MapPin class="size-4" />
                                        <span>View on Map</span>
                                    </div>
                                    <ChevronDown
                                        class="size-4 transition-transform duration-200 ease-out"
                                        classList={{ "rotate-180": showMap() }}
                                    />
                                </Collapsible.Trigger>
                                <Collapsible.Content>
                                    <div
                                        class="mt-2 aspect-video w-full cursor-pointer overflow-hidden rounded-lg"
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
                                </Collapsible.Content>
                            </Collapsible>
                        </Show>
                    </div>
                </div>

                <CardFooter class="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
                    <span>
                        Proposed by{" "}
                        <span class="font-medium text-neutral-900 dark:text-neutral-100">
                            {local.restaurant.addedBy}
                        </span>
                    </span>
                    <Show when={auth.isAuthenticated()}>
                        <button
                            type="button"
                            onClick={() => setShowEdit(true)}
                            aria-label="Edit restaurant"
                            class="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-neutral-200"
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
