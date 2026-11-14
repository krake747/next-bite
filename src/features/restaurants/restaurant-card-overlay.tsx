import { ArrowSquareOutIcon, ForkKnifeIcon, ImagesIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { type Restaurant } from "@core/restaurants"
import { Lightbox, useLightbox } from "@pattern/gallery"
import { GoogleAttribution } from "@pattern/google-attribution"
import { LazyImage } from "@pattern/lazy-image"
import { SocialMetadata } from "@pattern/social-metadata"
import { Badge } from "@ui/badge"
import { Card } from "@ui/card"
import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

import { RestaurantAddressLink } from "./restaurant-address-link"
import { RestaurantInterestButton } from "./restaurant-interest-button"
import { RestaurantPriceBadge, RestaurantStatusLine } from "./restaurant-signals"
import { useRestaurantSignals } from "./use-restaurant-signals"

export function RestaurantCardOverlay({
    restaurant,
    onToggleWant,
    detailsHref,
    ...cardProps
}: Readonly<
    {
        restaurant: Restaurant
        onToggleWant?: (() => void) | undefined
        detailsHref?: string | undefined
    } & React.ComponentProps<typeof Card>
>) {
    const googlePlaceId = restaurant.address.google?.placeId
    const hasLocation = googlePlaceId !== undefined && googlePlaceId !== ""
    const handleToggleWant = onToggleWant ?? (() => {})
    const lightbox = useLightbox(restaurant.photos)
    const signals = useRestaurantSignals(restaurant._id, googlePlaceId)
    const cover = restaurant.photos[0]?.url
    const tagline = restaurant.cuisine ?? "Saved place"

    const heading = (
        <h3 className="font-display text-2xl leading-8 font-semibold tracking-tight text-balance text-inverse">
            {restaurant.name}
        </h3>
    )

    return (
        <Card {...cardProps}>
            <div className="relative aspect-[16/10] overflow-hidden">
                {cover !== undefined ? (
                    <>
                        <LazyImage src={cover} alt={`${restaurant.name} photo`} className="absolute inset-0" />
                        <div
                            className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent"
                            aria-hidden="true"
                        />
                    </>
                ) : (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-stone-900 to-stone-700"
                        role="img"
                        aria-label={`No photos yet for ${restaurant.name}`}
                    >
                        <span className="font-display text-2xl font-semibold tracking-tight text-white/25 uppercase">
                            {tagline}
                        </span>
                    </div>
                )}

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge tone="brand">
                        <ForkKnifeIcon className="mr-1 size-3" aria-hidden="true" />
                        {tagline}
                    </Badge>
                    <RestaurantPriceBadge signals={signals} />
                </div>

                {restaurant.link !== undefined && restaurant.link !== "" && (
                    <a
                        href={restaurant.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View menu"
                        className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-colors duration-150 hover:bg-surface"
                    >
                        <ForkKnifeIcon className="size-3.5" aria-hidden="true" />
                        <span>Menu</span>
                        <ArrowSquareOutIcon className="size-3 opacity-70" aria-hidden="true" />
                    </a>
                )}

                {restaurant.photos.length > 1 && (
                    <div className="absolute right-3 bottom-3">
                        <button
                            type="button"
                            onClick={() => {
                                lightbox.openAt(0)
                            }}
                            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-colors duration-150 hover:bg-surface"
                        >
                            <ImagesIcon className="size-3.5" aria-hidden="true" />
                            <span className="tabular-nums">{restaurant.photos.length} photos</span>
                        </button>
                    </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-5 pb-4">
                    {detailsHref !== undefined ? (
                        <Link
                            to={detailsHref}
                            className={cx(focusRing(), "block rounded-sm hover:underline hover:decoration-inverse/60")}
                        >
                            {heading}
                        </Link>
                    ) : (
                        heading
                    )}
                    <div className="mt-0.5">
                        <SocialMetadata
                            ownerName={restaurant.ownerName}
                            wantCount={restaurant.wantCount}
                            tone="inverse"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 p-5 pt-4">
                <div className="flex flex-col gap-1">
                    <RestaurantAddressLink address={restaurant.address.label} hasLocation={hasLocation} />
                    <RestaurantStatusLine signals={signals} />
                </div>
                {restaurant.note !== undefined && restaurant.note !== "" && (
                    <div className="relative">
                        <div
                            className="absolute -top-1 left-2 font-display text-5xl leading-none text-tomato-400/30 select-none"
                            aria-hidden="true"
                        >
                            "
                        </div>
                        <div className="border-l-2 border-tomato-400/50 bg-tomato-50/30 py-3 pr-3 pl-5">
                            <p className="text-sm leading-relaxed text-foreground italic">{restaurant.note}</p>
                        </div>
                    </div>
                )}
                <RestaurantInterestButton
                    wanted={restaurant.mySave === "want"}
                    wantCount={restaurant.wantCount}
                    onToggleWant={handleToggleWant}
                />
                <div className="flex justify-end">
                    <GoogleAttribution />
                </div>
            </div>
            <Lightbox lightbox={lightbox} />
        </Card>
    )
}
