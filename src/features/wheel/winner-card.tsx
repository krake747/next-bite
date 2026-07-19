import MapPin from "lucide-react/icons/map-pin"
import Utensils from "lucide-react/icons/utensils"

import type { Restaurant } from "@core/hooks"
import { LazyImage } from "@pattern/lazy-image"
import { OpeningHours } from "@ui/opening-hours"

export function WinnerCard({ restaurant }: { restaurant: Restaurant }) {
    const hasLocation = restaurant.lat != null && restaurant.lng != null
    const hasImages = (restaurant.images?.length ?? 0) > 0
    const imageSrc = hasImages ? restaurant.images?.[0]?.url : undefined

    return (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-white/8 dark:bg-neutral-800/50">
            {hasImages ? (
                <div className="aspect-3/2 w-full overflow-hidden">
                    <LazyImage
                        src={imageSrc}
                        alt={`${restaurant.name} - main image`}
                        aspectRatio="3/2"
                        loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                </div>
            ) : (
                <div className="flex aspect-3/2 items-center justify-center bg-linear-to-br from-[#f5f4f2] to-[#ebe9e6] dark:from-[#2d2b29] dark:to-[#262523]">
                    <div className="flex flex-col items-center gap-2">
                        <Utensils className="size-6 text-neutral-400 dark:text-neutral-500" />
                        <span className="text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-500">
                            {restaurant.cuisine}
                        </span>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                    <span className="rounded-full bg-flame-pea-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-flame-pea-700 uppercase dark:bg-flame-pea-950/50 dark:text-flame-pea-400">
                        {restaurant.cuisine}
                    </span>
                </div>

                <h3
                    className="text-lg leading-tight font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    {restaurant.name}
                </h3>

                {restaurant.location && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <MapPin className="size-3 shrink-0" />
                        {hasLocation ? (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate transition-colors hover:text-flame-pea-600 dark:hover:text-flame-pea-400"
                            >
                                {restaurant.location}
                            </a>
                        ) : (
                            <span className="truncate">{restaurant.location}</span>
                        )}
                    </div>
                )}
                {restaurant.openingHours && <OpeningHours openingHours={restaurant.openingHours} />}
            </div>
        </div>
    )
}
