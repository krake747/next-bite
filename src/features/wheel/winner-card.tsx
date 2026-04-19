import { Show, createMemo } from "solid-js"
import MapPin from "lucide-solid/icons/map-pin"
import Utensils from "lucide-solid/icons/utensils"
import { LazyImage } from "@ui/lazy-image"
import { OpeningHours } from "@ui/opening-hours"
import type { Restaurant } from "@core/hooks"

export function WinnerCard(props: { restaurant: Restaurant }) {
    const hasLocation = () => props.restaurant.lat != null && props.restaurant.lng != null
    const hasImages = () => (props.restaurant.images?.length ?? 0) > 0
    const imageSrc = createMemo(() => (hasImages() ? props.restaurant.images?.[0]?.url : undefined))

    return (
        <div class="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 dark:border-white/8 dark:bg-neutral-800/50">
            <Show
                when={hasImages()}
                fallback={
                    <div class="flex aspect-3/2 items-center justify-center bg-linear-to-br from-[#f5f4f2] to-[#ebe9e6] dark:from-[#2d2b29] dark:to-[#262523]">
                        <div class="flex flex-col items-center gap-2">
                            <Utensils class="size-6 text-neutral-400 dark:text-neutral-500" />
                            <span class="text-xs tracking-wide text-neutral-500 uppercase dark:text-neutral-500">
                                {props.restaurant.cuisine}
                            </span>
                        </div>
                    </div>
                }
            >
                <div class="aspect-3/2 w-full overflow-hidden">
                    <LazyImage
                        src={imageSrc()}
                        alt={`${props.restaurant.name} - main image`}
                        aspectRatio="3/2"
                        loading="lazy"
                    />
                    <div class="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                </div>
            </Show>

            <div class="flex flex-col gap-2 p-3">
                <div class="flex items-center gap-2">
                    <span class="rounded-full bg-flame-pea-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-flame-pea-700 uppercase dark:bg-flame-pea-950/50 dark:text-flame-pea-400">
                        {props.restaurant.cuisine}
                    </span>
                </div>

                <h3
                    class="text-lg leading-tight font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
                    style={{
                        "font-family": "var(--font-display)",
                    }}
                >
                    {props.restaurant.name}
                </h3>

                <Show when={props.restaurant.location}>
                    <div class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <MapPin class="size-3 shrink-0" />
                        <Show when={hasLocation()} fallback={<span class="truncate">{props.restaurant.location}</span>}>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.restaurant.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                class="truncate transition-colors hover:text-flame-pea-600 dark:hover:text-flame-pea-400"
                            >
                                {props.restaurant.location}
                            </a>
                        </Show>
                    </div>
                </Show>
                <Show when={props.restaurant.openingHours}>
                    <OpeningHours openingHours={props.restaurant.openingHours} />
                </Show>
            </div>
        </div>
    )
}
