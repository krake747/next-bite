import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"
import { Link } from "@tanstack/solid-router"
import Plus from "lucide-solid/icons/plus"

export function EmptyWheelState() {
    return (
        <div class="flex flex-col items-center py-12 text-center">
            <div class="relative mb-6">
                <div class="flex size-48 items-center justify-center rounded-full border-2 border-dashed border-flame-pea-300 bg-linear-to-br from-flame-pea-50 to-white sm:size-56 dark:border-flame-pea-800 dark:from-flame-pea-900/20 dark:to-[#1a1918]">
                    <div class="text-center">
                        <div class="mb-3 flex justify-center">
                            <div class="flex size-14 items-center justify-center rounded-full bg-white shadow-md dark:bg-[#2d2c2b]">
                                <UtensilsCrossed class="size-7 text-flame-pea-600 dark:text-flame-pea-400" />
                            </div>
                        </div>
                        <p
                            class="text-lg leading-snug font-semibold text-neutral-800 dark:text-neutral-200"
                            style={{ "font-family": "var(--font-display)" }}
                        >
                            The wheel is hungry
                        </p>
                    </div>
                </div>

                <div class="absolute -top-2 -right-2 size-4 rounded-full bg-flame-pea-400/30 dark:bg-flame-pea-500/30" />
                <div class="absolute -bottom-1 -left-3 size-3 rounded-full bg-flame-pea-300/40 dark:bg-flame-pea-600/30" />
            </div>

            <p class="mb-2 text-base text-neutral-600 dark:text-neutral-400">Add a restaurant to spin the wheel</p>

            <Link
                to="/"
                viewTransition
                class="mt-4 inline-flex items-center justify-center gap-x-1.5 rounded-md bg-flame-pea-700 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-flame-pea-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-pea-700 active:scale-[0.97] dark:bg-flame-pea-600 dark:text-neutral-900 dark:hover:bg-flame-pea-500 dark:focus-visible:outline-flame-pea-50"
            >
                <Plus class="size-4" />
                Add Restaurants
            </Link>
        </div>
    )
}
