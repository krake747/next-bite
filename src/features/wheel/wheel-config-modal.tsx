import { For, Show, createSignal, createMemo } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { useWheel } from "./wheel-context"
import { type Restaurant } from "../../core/hooks"
import { cx } from "../../ui/variants"
import Settings from "lucide-solid/icons/settings"
import Shuffle from "lucide-solid/icons/shuffle"
import Check from "lucide-solid/icons/check"
import AlertCircle from "lucide-solid/icons/circle-alert"
import X from "lucide-solid/icons/x"
import Search from "lucide-solid/icons/search"
import { Button } from "../../ui/button"

export function WheelConfigModal(props: {
    show: boolean
    onOpenChange: (open: boolean) => void
    restaurants: () => Restaurant[]
}) {
    const wheel = useWheel()
    const [searchQuery, setSearchQuery] = createSignal("")

    const filteredRestaurants = createMemo(() => {
        const query = searchQuery().toLowerCase().trim()
        if (!query) return props.restaurants()
        return props.restaurants().filter((r) => r.name.toLowerCase().includes(query))
    })

    return (
        <Dialog open={props.show} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Content class="relative w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200/60 bg-[#faf9f7]/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <div class="mb-6 flex items-center gap-3">
                            <div class="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white dark:from-flame-pea-600 dark:to-flame-pea-700">
                                <Settings class="size-5" />
                            </div>
                            <Dialog.Title
                                class="text-xl font-semibold text-neutral-900 dark:text-white"
                                style={{ "font-family": "var(--font-display)" }}
                            >
                                Wheel Settings
                            </Dialog.Title>
                        </div>

                        <div class="space-y-5">
                            <Show when={!wheel.hasEnoughRestaurants()}>
                                <div class="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                    <AlertCircle class="mt-0.5 size-4 shrink-0" />
                                    <span>Need at least 1 restaurant to spin. Add a restaurant first.</span>
                                </div>
                            </Show>

                            <Show when={wheel.hasEnoughRestaurants()}>
                                <div class="space-y-3">
                                    <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Selection Mode
                                    </label>
                                    <div class="grid grid-cols-2 gap-3">
                                        <Button
                                            variant={wheel.selectionMode() === "random" ? "primary" : "secondary"}
                                            onClick={() => wheel.setSelectionMode("random")}
                                        >
                                            <Shuffle class="size-4" />
                                            Random
                                        </Button>
                                        <Button
                                            variant={wheel.selectionMode() === "manual" ? "primary" : "secondary"}
                                            onClick={() => wheel.setSelectionMode("manual")}
                                        >
                                            <Check class="size-4" />
                                            Manual
                                        </Button>
                                    </div>
                                </div>

                                <div class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            Number of Restaurants
                                        </label>
                                    </div>
                                    <div class="relative">
                                        <select
                                            value={wheel.targetCount()}
                                            onChange={(e) => wheel.setTargetCount(parseInt(e.currentTarget.value))}
                                            class="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-10 text-sm text-neutral-900 focus:border-flame-pea-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                        >
                                            <For each={wheel.availableCountOptions()}>
                                                {(count) => <option value={count}>{count} restaurants</option>}
                                            </For>
                                        </select>
                                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                            <svg
                                                class="size-4 text-neutral-400"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    stroke-linecap="round"
                                                    stroke-linejoin="round"
                                                    stroke-width={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                <Show when={wheel.selectionMode() === "manual"}>
                                    <div class="space-y-3">
                                        <div class="flex items-center justify-between">
                                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                Select Restaurants
                                            </label>
                                            <span
                                                class={cx(
                                                    "text-xs font-medium",
                                                    wheel.selectedIds().length === wheel.targetCount()
                                                        ? "text-flame-pea-600 dark:text-flame-pea-400"
                                                        : "text-neutral-400 dark:text-neutral-500",
                                                )}
                                            >
                                                {wheel.selectedIds().length}/{wheel.targetCount()} selected
                                            </span>
                                        </div>

                                        <div class="relative">
                                            <Search class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                                            <input
                                                type="text"
                                                value={searchQuery()}
                                                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                                                placeholder="Search restaurants..."
                                                class="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-500"
                                            />
                                            <Show when={searchQuery()}>
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    class="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-600"
                                                >
                                                    <X class="size-3" />
                                                </button>
                                            </Show>
                                        </div>

                                        <div class="max-h-52 overflow-y-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-700/50">
                                            <For each={filteredRestaurants()}>
                                                {(restaurant) => {
                                                    const isSelected = wheel.selectedIds().includes(restaurant._id)

                                                    return (
                                                        <label
                                                            class={cx(
                                                                "flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 transition-colors last:border-b-0 dark:border-neutral-700",
                                                                isSelected
                                                                    ? "bg-flame-pea-50 dark:bg-flame-pea-900/20"
                                                                    : "hover:bg-neutral-50 dark:hover:bg-neutral-700/50",
                                                            )}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() =>
                                                                    wheel.toggleRestaurantSelection(restaurant._id)
                                                                }
                                                                class="size-4 rounded border-neutral-300 text-flame-pea-700 focus:ring-flame-pea-700 dark:border-neutral-600"
                                                            />
                                                            <span
                                                                class={cx(
                                                                    "text-sm",
                                                                    isSelected
                                                                        ? "font-medium text-flame-pea-700 dark:text-flame-pea-400"
                                                                        : "text-neutral-700 dark:text-neutral-300",
                                                                )}
                                                            >
                                                                {restaurant.name}
                                                            </span>
                                                        </label>
                                                    )
                                                }}
                                            </For>
                                        </div>

                                        <Show when={filteredRestaurants().length === 0}>
                                            <p class="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                                No restaurants match your search
                                            </p>
                                        </Show>

                                        <Show
                                            when={wheel.selectedIds().length === 0 && filteredRestaurants().length > 0}
                                        >
                                            <p class="text-xs text-amber-600 dark:text-amber-400">
                                                Please select at least 1 restaurant to spin
                                            </p>
                                        </Show>
                                    </div>
                                </Show>
                            </Show>
                        </div>

                        <div class="mt-6 flex justify-end">
                            <Button
                                class="w-full"
                                onClick={() => props.onOpenChange(false)}
                                disabled={!wheel.hasEnoughRestaurants()}
                            >
                                Done
                            </Button>
                        </div>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
