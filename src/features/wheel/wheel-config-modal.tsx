import { For, Show } from "solid-js"
import { useWheel } from "./wheel-context"
import { type Restaurant } from "../../core/hooks"
import { cx } from "../../ui/variants"
import Settings from "lucide-solid/icons/settings"
import Shuffle from "lucide-solid/icons/shuffle"
import Check from "lucide-solid/icons/check"
import AlertCircle from "lucide-solid/icons/circle-alert"
import { Button } from "../../ui/button"

export function WheelConfigModal(props: { restaurants: () => Restaurant[]; onClose: () => void }) {
    const wheel = useWheel()

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div class="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                <div class="mb-4 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Settings class="size-5 text-neutral-500" />
                        <span class="font-medium text-neutral-900 dark:text-white">Wheel Settings</span>
                    </div>
                    <button
                        onClick={props.onClose}
                        class="rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                        aria-label="Close settings"
                    >
                        <span class="sr-only">Close</span>
                        <svg class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                <div class="space-y-4">
                    <Show when={!wheel.hasEnoughRestaurants()}>
                        <div class="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            <AlertCircle class="size-4" />
                            <span>Need at least 2 restaurants to spin. Add more restaurants first.</span>
                        </div>
                    </Show>

                    <Show when={wheel.hasEnoughRestaurants()}>
                        <div class="space-y-3">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Selection Mode
                            </label>
                            <div class="flex gap-2">
                                <button
                                    onClick={() => wheel.setSelectionMode("random")}
                                    class={cx(
                                        "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        wheel.selectionMode() === "random"
                                            ? "bg-flame-pea-700 text-white dark:bg-flame-pea-600"
                                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600",
                                    )}
                                >
                                    <Shuffle class="size-4" />
                                    Random
                                </button>
                                <button
                                    onClick={() => wheel.setSelectionMode("manual")}
                                    class={cx(
                                        "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                        wheel.selectionMode() === "manual"
                                            ? "bg-flame-pea-700 text-white dark:bg-flame-pea-600"
                                            : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600",
                                    )}
                                >
                                    <Check class="size-4" />
                                    Manual Pick
                                </button>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                Number of Restaurants
                            </label>
                            <select
                                value={wheel.targetCount()}
                                onChange={(e) => wheel.setTargetCount(parseInt(e.currentTarget.value))}
                                class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                            >
                                <For each={wheel.availableCountOptions()}>
                                    {(count) => <option value={count}>{count} restaurants</option>}
                                </For>
                            </select>
                            <p class="text-xs text-neutral-500">Even numbers only (2, 4, 6, etc.)</p>
                        </div>

                        <Show when={wheel.selectionMode() === "manual"}>
                            <div class="space-y-3">
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Select Restaurants
                                    <span class="ml-1 text-xs text-neutral-500">
                                        ({wheel.selectedIds().length}/{wheel.targetCount()} selected)
                                    </span>
                                </label>
                                <div class="max-h-48 overflow-y-auto rounded-md border border-neutral-200 dark:border-neutral-700">
                                    <For each={props.restaurants()}>
                                        {(restaurant) => (
                                            <label class="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-3 py-2 last:border-b-0 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-700/50">
                                                <input
                                                    type="checkbox"
                                                    checked={wheel.selectedIds().includes(restaurant._id)}
                                                    onChange={() => wheel.toggleRestaurantSelection(restaurant._id)}
                                                    disabled={
                                                        !wheel.selectedIds().includes(restaurant._id) &&
                                                        wheel.selectedIds().length >= wheel.targetCount()
                                                    }
                                                    class="size-4 rounded border-neutral-300 text-flame-pea-700 focus:ring-flame-pea-700 disabled:opacity-50 dark:border-neutral-600"
                                                />
                                                <span class="text-sm text-neutral-700 dark:text-neutral-300">
                                                    {restaurant.name}
                                                </span>
                                            </label>
                                        )}
                                    </For>
                                </div>
                                <Show when={wheel.selectedIds().length < wheel.targetCount()}>
                                    <p class="text-xs text-amber-600 dark:text-amber-400">
                                        Please select {wheel.targetCount() - wheel.selectedIds().length} more
                                        restaurant(s)
                                    </p>
                                </Show>
                            </div>
                        </Show>

                        <Button class="w-full" onClick={props.onClose}>
                            Done
                        </Button>
                    </Show>
                </div>
            </div>
        </div>
    )
}
