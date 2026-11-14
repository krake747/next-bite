import { ArrowSquareOutIcon, ForkKnifeIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { type Restaurant } from "@core/restaurants"
import { GoogleAttribution } from "@pattern/google-attribution"
import { Card } from "@ui/card"
import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

import { formatPriceLevel } from "./place-details-utils"
import { RestaurantAddressLink } from "./restaurant-address-link"
import { RestaurantInterestButton } from "./restaurant-interest-button"
import { RestaurantStatusLine } from "./restaurant-signals"
import { useRestaurantSignals } from "./use-restaurant-signals"

export function RestaurantCardCompact({
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
    const hasLocation = restaurant.address.google?.placeId !== undefined && restaurant.address.google.placeId !== ""
    const handleToggleWant = onToggleWant ?? (() => {})
    const signals = useRestaurantSignals(restaurant._id, restaurant.address.google?.placeId)
    const cover = restaurant.photos[0]?.url
    const cuisine = restaurant.cuisine !== undefined && restaurant.cuisine !== "" ? restaurant.cuisine : undefined
    const price = signals.status === "ready" ? formatPriceLevel(signals.priceLevel) : undefined
    const eyebrow = [cuisine, price].filter((part) => part !== undefined).join(" · ")

    const heading = (
        <h3 className="line-clamp-2 font-display text-lg leading-6 font-semibold tracking-tight text-balance text-foreground">
            {restaurant.name}
        </h3>
    )

    return (
        <Card {...cardProps}>
            <div className="flex flex-col p-4">
                <div className="flex gap-3">
                    {cover !== undefined ? (
                        <img
                            src={cover}
                            alt={`${restaurant.name} photo`}
                            loading="lazy"
                            className="size-20 shrink-0 rounded-xl object-cover outline-1 -outline-offset-1 outline-black/10"
                        />
                    ) : (
                        <div
                            className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-tomato-100"
                            role="img"
                            aria-label={`No photos yet for ${restaurant.name}`}
                        >
                            <span className="font-display text-2xl font-semibold text-tomato-700" aria-hidden="true">
                                {(restaurant.cuisine ?? restaurant.name).charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        {eyebrow !== "" && (
                            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                                {eyebrow}
                            </p>
                        )}
                        {detailsHref !== undefined ? (
                            <Link to={detailsHref} className={cx(focusRing(), "rounded-sm hover:text-primary")}>
                                {heading}
                            </Link>
                        ) : (
                            heading
                        )}
                        <p className="truncate text-[13px] text-muted-foreground">
                            Added by {restaurant.ownerName}
                            {restaurant.wantCount !== 0 && (
                                <>
                                    {" · "}
                                    <span className="tabular-nums">
                                        {restaurant.wantCount} want{restaurant.wantCount === 1 ? "s" : ""} to try
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
                <div className="mt-3 flex flex-col gap-1">
                    <RestaurantAddressLink address={restaurant.address.label} hasLocation={hasLocation} />
                    <RestaurantStatusLine signals={signals} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <RestaurantInterestButton
                        wanted={restaurant.mySave === "want"}
                        wantCount={restaurant.wantCount}
                        onToggleWant={handleToggleWant}
                    />
                    {restaurant.link !== undefined && restaurant.link !== "" && (
                        <a
                            href={restaurant.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="View menu"
                            className={cx(
                                focusRing(),
                                "inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-surface-muted hover:text-foreground",
                            )}
                        >
                            <ForkKnifeIcon className="size-4" aria-hidden="true" />
                            <span>Menu</span>
                            <ArrowSquareOutIcon className="size-3 opacity-70" aria-hidden="true" />
                        </a>
                    )}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address.label)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx(
                            focusRing(),
                            "rounded-sm text-[13px] font-medium text-muted-foreground underline decoration-border-strong underline-offset-2 transition-colors duration-150 hover:text-primary",
                        )}
                    >
                        Get directions
                    </a>
                    <GoogleAttribution />
                </div>
            </div>
        </Card>
    )
}
