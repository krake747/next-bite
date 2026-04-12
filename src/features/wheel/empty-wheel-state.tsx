import UtensilsCrossed from "lucide-solid/icons/utensils-crossed"

export function EmptyWheelState() {
    return (
        <div class="flex flex-col items-center space-y-4 text-center">
            <div class="flex size-80 items-center justify-center rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                <div class="text-neutral-500 dark:text-neutral-400">
                    <UtensilsCrossed class="mx-auto mb-4 size-16 opacity-50" />
                    <p class="text-lg font-medium">No restaurants to spin</p>
                    <p class="mt-2 text-sm">Add some restaurants to get started!</p>
                </div>
            </div>
        </div>
    )
}
