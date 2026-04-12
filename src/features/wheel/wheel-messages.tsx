import Sparkles from "lucide-solid/icons/sparkles"
import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"

export function Instructions() {
    return (
        <div class="text-center">
            <div class="mb-3 flex justify-center">
                <div class="flex size-12 items-center justify-center rounded-full bg-flame-pea-100 dark:bg-flame-pea-900/30">
                    <UtensilsCrossed class="size-6 text-flame-pea-600 dark:text-flame-pea-400" />
                </div>
            </div>
            <p
                class="text-lg leading-relaxed font-medium text-neutral-700 dark:text-neutral-300"
                style={{ "font-family": "var(--font-body)" }}
            >
                Press the button to give the wheel a whirl.
            </p>
            <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-500">
                Let fate (or your stomach) decide where to dine.
            </p>
        </div>
    )
}

export function WinnerMessage() {
    return (
        <div class="animate-fade-in text-center">
            <div class="mb-3 flex justify-center">
                <div class="flex size-14 items-center justify-center rounded-full bg-linear-to-br from-flame-pea-600 to-flame-pea-800 shadow-lg">
                    <Sparkles class="size-7 text-white" />
                </div>
            </div>
            <h2
                class="text-3xl leading-tight font-semibold tracking-tight text-flame-pea-700 dark:text-flame-pea-400"
                style={{ "font-family": "var(--font-display)" }}
            >
                We have a winner!
            </h2>
            <p class="mt-2 text-sm text-neutral-500 dark:text-neutral-500">Your next culinary adventure awaits</p>
        </div>
    )
}
