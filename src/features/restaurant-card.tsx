import { createSignal, splitProps, Show } from "solid-js"
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Badge } from "../ui/badge"
import MapPin from "lucide-solid/icons/map-pin"
import Utensils from "lucide-solid/icons/utensils"
import ExternalLink from "lucide-solid/icons/external-link"
import SquarePen from "lucide-solid/icons/square-pen"
import Images from "lucide-solid/icons/images"
import ChevronDown from "lucide-solid/icons/chevron-down"
import { Collapsible } from "@kobalte/core/collapsible"
import { Map, AdvancedMarker } from "solid-google-maps"
import { useUpdateRestaurant, useAuth, type Restaurant } from "../core/hooks"
import { EditRestaurantDialog } from "./edit-restaurant-dialog"
import { EmojiRating } from "../ui/emoji-rating"
import { LazyImage } from "../ui/lazy-image"
import { ImageGalleryModal } from "../ui/image-gallery-modal"
import { Button } from "../ui/button"
import type { ComponentProps } from "solid-js"

export function RestaurantCard(props: { restaurant: Restaurant } & ComponentProps<typeof Card>) {
    const [local, cardProps] = splitProps(props, ["restaurant"])
    const [showEdit, setShowEdit] = createSignal(false)
    const [showGallery, setShowGallery] = createSignal(false)
    const [showMap, setShowMap] = createSignal(false)
    const [showImages, setShowImages] = createSignal(false)
    const updateRestaurant = useUpdateRestaurant()
    const auth = useAuth()

    const hasLocation = () => local.restaurant.lat != null && local.restaurant.lng != null
    const hasImages = () => (local.restaurant.images?.length ?? 0) > 0
    const imageCount = () => local.restaurant.images?.length ?? 0

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
                <CardHeader class="grid grid-cols-[1fr_auto]">
                    <h3 class="text-xl font-semibold">{local.restaurant.name} </h3>
                    <Badge variant="gray">
                        <Utensils class="mr-1.5 size-3" />
                        {local.restaurant.cuisine}
                    </Badge>
                </CardHeader>

                <Show when={hasImages()}>
                    <CardContent class="p-0 px-4 pt-4">
                        <Collapsible open={showImages()} onOpenChange={setShowImages}>
                            <Collapsible.Trigger class="flex w-full items-center justify-between py-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
                                <div class="flex items-center gap-1.5">
                                    <Images class="size-4" />
                                    <span>Images ({imageCount()})</span>
                                </div>
                                <ChevronDown
                                    class="size-4 transition-transform duration-200"
                                    classList={{ "rotate-180": showImages() }}
                                />
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <div class="relative mb-4 aspect-video w-full overflow-hidden rounded-md">
                                    <LazyImage
                                        src={local.restaurant.images?.[0]}
                                        alt={`${local.restaurant.name} - main image`}
                                        aspectRatio="16/9"
                                        loading="lazy"
                                    />
                                    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                                    <Show when={imageCount() > 0}>
                                        <div class="absolute right-2 bottom-2">
                                            <Button variant="secondary" size="md" onClick={() => setShowGallery(true)}>
                                                <Images class="mr-1.5 size-4" />
                                                {imageCount() > 1 ? `View all ${imageCount()}` : "View"}
                                            </Button>
                                        </div>
                                    </Show>
                                </div>
                            </Collapsible.Content>
                        </Collapsible>
                    </CardContent>
                </Show>

                <Show when={hasLocation()}>
                    <CardContent class="p-0 px-4 pt-2">
                        <Collapsible open={showMap()} onOpenChange={setShowMap}>
                            <Collapsible.Trigger class="flex w-full items-center justify-between py-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
                                <div class="flex items-center gap-1.5">
                                    <MapPin class="size-4" />
                                    <span>Map</span>
                                </div>
                                <ChevronDown
                                    class="size-4 transition-transform duration-200"
                                    classList={{ "rotate-180": showMap() }}
                                />
                            </Collapsible.Trigger>
                            <Collapsible.Content>
                                <div
                                    class="mb-4 aspect-video w-full cursor-pointer overflow-hidden rounded-md"
                                    style={{ height: "250px" }}
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
                    </CardContent>
                </Show>
                <CardContent class="flex flex-1 flex-col justify-between gap-2">
                    <p class="text-neutral-500 dark:text-neutral-400">{local.restaurant.notes}</p>
                    <div class="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400">
                        <div class="flex items-center">
                            <MapPin class="mr-1.5 size-3.5 shrink-0" />
                            <Show when={hasLocation()} fallback={local.restaurant.location}>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(local.restaurant.location)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="hover:underline"
                                >
                                    {local.restaurant.location}
                                </a>
                            </Show>
                        </div>
                        {local.restaurant.link && (
                            <a
                                href={local.restaurant.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="flex items-center"
                                title="Visit menu"
                            >
                                <ExternalLink class="mr-1.5 size-3.5 shrink-0" />
                                Menu
                            </a>
                        )}
                    </div>
                </CardContent>
                <CardContent>
                    <EmojiRating rating={local.restaurant.rating ?? null} onRate={handleRate} />
                </CardContent>
                <CardFooter class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
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
                            class="cursor-pointer text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
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
