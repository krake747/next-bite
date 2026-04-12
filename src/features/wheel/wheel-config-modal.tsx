import { For, Show, createSignal, createMemo } from "solid-js"
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

export function WheelConfigModal(props: { restaurants: () => Restaurant[]; onClose: () => void }) {
    const wheel = useWheel()
    const [searchQuery, setSearchQuery] = createSignal("")

    const filteredRestaurants = createMemo(() => {
        const query = searchQuery().toLowerCase().trim()
        if (!query) return props.restaurants()
        return props.restaurants().filter((r) => r.name.toLowerCase().includes(query))
    })

    return (
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-sm">
            <div class="max-h-[85vh] w-full max-w-md overflow-hidden rounded-xl border border-neutral-200/80 bg-[#faf9f7] shadow-2xl dark:border-neutral-700 dark:bg-[#1a1918]">
                {/* Header */}
                <div class="border-b border-neutral-200/60 bg-white px-5 py-4 dark:border-neutral-700 dark:bg-[#1f1e1d]">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="flex size-9 items-center justify-center rounded-lg bg-flame-pea-100 dark:bg-flame-pea-900/50">
                                <Settings class="size-5 text-flame-pea-600 dark:text-flame-pea-400" />
                            </div>
                            <div>
                                <h2
                                    class="text-lg leading-tight font-semibold text-neutral-900 dark:text-white"
                                    style={{ "font-family": "var(--font-display)" }}
                                >
                                    Wheel Settings
                                </h2>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    Customize your spin experience
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={props.onClose}
                            class="flex size-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
                            aria-label="Close settings"
                        >
                            <X class="size-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div class="space-y-5 overflow-y-auto p-5">
                    <Show when={!wheel.hasEnoughRestaurants()}>
                        <div class="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            <AlertCircle class="mt-0.5 size-4 shrink-0" />
                            <span>Need at least 1 restaurant to spin. Add a restaurant first.</span>
                        </div>
                    </Show>

                    <Show when={wheel.hasEnoughRestaurants()}>
                        {/* Selection Mode */}
                        <div class="space-y-3">
                            <label class="block text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                                Selection Mode
                            </label>
                            <div class="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => wheel.setSelectionMode("random")}
                                    class={cx(
                                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                                        wheel.selectionMode() === "random"
                                            ? "border-flame-pea-700 bg-flame-pea-700 text-white shadow-md dark:border-flame-pea-600 dark:bg-flame-pea-600"
                                            : "border-neutral-200 bg-white text-neutral-700 hover:border-flame-pea-300 hover:bg-flame-pea-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:border-flame-pea-700",
                                    )}
                                >
                                    <Shuffle class="size-4" />
                                    Random
                                </button>
                                <button
                                    onClick={() => wheel.setSelectionMode("manual")}
                                    class={cx(
                                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                                        wheel.selectionMode() === "manual"
                                            ? "border-flame-pea-700 bg-flame-pea-700 text-white shadow-md dark:border-flame-pea-600 dark:bg-flame-pea-600"
                                            : "border-neutral-200 bg-white text-neutral-700 hover:border-flame-pea-300 hover:bg-flame-pea-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:border-flame-pea-700",
                                    )}
                                >
                                    <Check class="size-4" />
                                    Manual
                                </button>
                            </div>
                        </div>

                        {/* Number of Restaurants */}
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="block text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
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

                        {/* Manual Selection */}
                        <Show when={wheel.selectionMode() === "manual"}>
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <label class="block text-xs font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
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

                                {/* Search Input */}
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
                                                        onChange={() => wheel.toggleRestaurantSelection(restaurant._id)}
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

                                <Show when={wheel.selectedIds().length === 0 && filteredRestaurants().length > 0}>
                                    <p class="text-xs text-amber-600 dark:text-amber-400">
                                        Please select at least 1 restaurant to spin
                                    </p>
                                </Show>
                            </div>
                        </Show>
                    </Show>
                </div>

                {/* Footer */}
                <div class="border-t border-neutral-200/60 bg-white px-5 py-4 dark:border-neutral-700 dark:bg-[#1f1e1d]">
                    <Button class="w-full" onClick={props.onClose} disabled={!wheel.hasEnoughRestaurants()}>
                        Done
                    </Button>
                </div>
            </div>
        </div>
    )
}
