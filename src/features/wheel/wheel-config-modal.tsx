import { useState, useMemo, useEffect } from "react"
import { Dialog } from "@base-ui-components/react/dialog"
import { useWheel } from "./wheel-context"
import { type Restaurant } from "@core/hooks"
import { cx } from "@ui/variants"
import Sliders from "lucide-react/icons/sliders"
import Check from "lucide-react/icons/check"
import AlertCircle from "lucide-react/icons/circle-alert"
import X from "lucide-react/icons/x"
import Search from "lucide-react/icons/search"
import { Button } from "@ui/button"

export function WheelConfigModal({
    show,
    onOpenChange,
    restaurants,
    defaultToManual,
    onSpin,
}: {
    show: boolean
    onOpenChange: (open: boolean) => void
    restaurants: Restaurant[]
    defaultToManual?: boolean
    onSpin?: () => void
}) {
    const wheel = useWheel()
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (show && defaultToManual) {
            wheel.setSelectionMode("manual")
        }
    }, [show])

    useEffect(() => {
        if (!show) {
            setSearchQuery("")
        }
    }, [show])

    const filteredRestaurants = useMemo(() => {
        const query = searchQuery.toLowerCase().trim()
        if (!query) return restaurants
        return restaurants.filter((r) => r.name.toLowerCase().includes(query))
    }, [searchQuery, restaurants])

    const canSpin = wheel.hasEnoughRestaurants && wheel.selectedIds.length > 0

    return (
        <Dialog.Root open={show} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Popup className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200/60 bg-[#faf9f7]/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white dark:from-flame-pea-600 dark:to-flame-pea-700">
                                <Sliders className="size-5" />
                            </div>
                            <Dialog.Title
                                className="text-xl font-semibold text-neutral-900 dark:text-white"
                                style={{ fontFamily: "var(--font-display)" }}
                            >
                                Build Your Own
                            </Dialog.Title>
                        </div>

                        <div className="space-y-5">
                            {!wheel.hasEnoughRestaurants && (
                                <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                    <span>Need at least 1 restaurant to spin. Add a restaurant first.</span>
                                </div>
                            )}

                            {wheel.hasEnoughRestaurants && (
                                <>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor="target-count-select"
                                                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                                            >
                                                Max Number of Restaurants
                                            </label>
                                        </div>
                                        <div className="relative">
                                            <select
                                                id="target-count-select"
                                                value={wheel.targetCount}
                                                onChange={(e) => wheel.setTargetCount(parseInt(e.currentTarget.value))}
                                                className="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-4 py-2.5 pr-10 text-sm text-neutral-900 focus:border-flame-pea-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                                            >
                                                {wheel.availableCountOptions.map((count) => (
                                                    <option key={count} value={count}>
                                                        {count}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                                <svg
                                                    className="size-4 text-neutral-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex cursor-pointer items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={wheel.filterClosedToday}
                                                onChange={() => wheel.toggleFilterClosedToday()}
                                                className="size-4 rounded border-neutral-300 text-flame-pea-700 focus:ring-flame-pea-700 dark:border-neutral-600"
                                            />
                                            <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                Exclude closed restaurants today
                                            </span>
                                        </label>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                                Select Restaurants
                                            </label>
                                            <span
                                                className={cx(
                                                    "text-xs font-medium",
                                                    wheel.selectedIds.length === wheel.targetCount
                                                        ? "text-flame-pea-600 dark:text-flame-pea-400"
                                                        : wheel.selectedIds.length > 0
                                                          ? "text-flame-pea-500/70 dark:text-flame-pea-400/70"
                                                          : "text-neutral-400 dark:text-neutral-500",
                                                )}
                                            >
                                                {wheel.selectedIds.length === wheel.targetCount
                                                    ? "Ready to spin"
                                                    : `${wheel.selectedIds.length}/${wheel.targetCount} selected`}
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                                placeholder="Search restaurants..."
                                                aria-label="Search restaurants"
                                                className="w-full rounded-lg border border-neutral-200 bg-white py-2 pr-3 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-flame-pea-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-700 dark:text-white dark:placeholder:text-neutral-500"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:text-neutral-500 dark:hover:bg-neutral-600"
                                                    aria-label="Clear search"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-52 overflow-y-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-700/50">
                                            {filteredRestaurants.map((restaurant) => {
                                                const isSelected = wheel.selectedIds.includes(restaurant._id)
                                                return (
                                                    <label
                                                        key={restaurant._id}
                                                        className={cx(
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
                                                            className="size-4 rounded border-neutral-300 text-flame-pea-700 focus:ring-flame-pea-700 dark:border-neutral-600"
                                                        />
                                                        <span
                                                            className={cx(
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
                                            })}
                                        </div>

                                        {filteredRestaurants.length === 0 && (
                                            <p className="py-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                                No restaurants match your search
                                            </p>
                                        )}

                                        {(wheel.selectedIds.length === 0 ||
                                            (wheel.selectedIds.length > 0 && wheel.selectedIds.length < wheel.targetCount)) &&
                                            filteredRestaurants.length > 0 && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                                    {wheel.selectedIds.length === 0
                                                        ? "Please select at least 1 restaurant to spin"
                                                        : `You can add ${Number(wheel.targetCount) - wheel.selectedIds.length} more optional selections`}
                                                </p>
                                            )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={() => {
                                    onOpenChange(false)
                                    onSpin?.()
                                }}
                                disabled={!canSpin}
                            >
                                <Check className="size-4" />
                                Spin
                            </Button>
                        </div>
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
