import { Dialog } from "@base-ui/react/dialog"
import Check from "lucide-react/icons/check"
import AlertCircle from "lucide-react/icons/circle-alert"
import Search from "lucide-react/icons/search"
import Sliders from "lucide-react/icons/sliders"
import X from "lucide-react/icons/x"
import { useState, useEffect } from "react"

import { type Restaurant } from "@core/hooks"
import { Button } from "@ui/button"
import { cx } from "@ui/variants"

import { useWheel } from "./wheel-context"

export function WheelConfigModal({
    show,
    onOpenChange,
    restaurants,
    defaultToManual,
    onSpin,
}: Readonly<{
    show: boolean
    onOpenChange: (open: boolean) => void
    restaurants: ReadonlyArray<Restaurant>
    defaultToManual?: boolean
    onSpin?: () => void
}>) {
    const wheel = useWheel()
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (show && defaultToManual === true) {
            wheel.setSelectionMode("manual")
        }
        if (!show) {
            // eslint-disable-next-line react-compiler/react-compiler
            setSearchQuery("")
        }
    }, [show])

    const query = searchQuery.toLowerCase().trim()
    const filteredRestaurants = query ? restaurants.filter((r) => r.name.toLowerCase().includes(query)) : restaurants

    const canSpin = wheel.hasEnoughRestaurants && wheel.selectedIds.length > 0

    return (
        <Dialog.Root open={show} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Popup className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200/60 bg-background/95 p-6 shadow-popover backdrop-blur-md">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-tomato-500 to-tomato-600 text-white">
                                <Sliders className="size-5" />
                            </div>
                            <Dialog.Title
                                className="text-xl font-semibold text-stone-900"
                                style={{ fontFamily: "var(--font-display)" }}
                            >
                                Build Your Own
                            </Dialog.Title>
                        </div>

                        <div className="space-y-5">
                            {!wheel.hasEnoughRestaurants && (
                                <div className="flex items-start gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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
                                                className="block text-sm font-medium text-stone-700"
                                            >
                                                Max Number of Restaurants
                                            </label>
                                        </div>
                                        <div className="relative">
                                            <select
                                                id="target-count-select"
                                                value={wheel.targetCount}
                                                onChange={(
                                                    e: Readonly<{ currentTarget: Readonly<{ value: string }> }>,
                                                ) => {
                                                    wheel.setTargetCount(parseInt(e.currentTarget.value))
                                                }}
                                                className="w-full appearance-none rounded-lg border border-stone-200 bg-surface px-4 py-2.5 pr-10 text-sm text-stone-900 focus:border-tomato-500 focus:outline-none"
                                            >
                                                {wheel.availableCountOptions.map((count) => (
                                                    <option key={count} value={count}>
                                                        {count}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                                                <svg
                                                    className="size-4 text-stone-400"
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
                                                onChange={() => {
                                                    wheel.toggleFilterClosedToday()
                                                }}
                                                className="size-4 rounded border-stone-300 text-tomato-700 focus:ring-tomato-700"
                                            />
                                            <span className="text-sm text-stone-700">
                                                Exclude closed restaurants today
                                            </span>
                                        </label>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="block text-sm font-medium text-stone-700">
                                                Select Restaurants
                                            </label>
                                            <span
                                                className={cx(
                                                    "text-xs font-medium",
                                                    wheel.selectedIds.length === wheel.targetCount
                                                        ? "text-tomato-600"
                                                        : wheel.selectedIds.length > 0
                                                          ? "text-tomato-500/70"
                                                          : "text-stone-400",
                                                )}
                                            >
                                                {wheel.selectedIds.length === wheel.targetCount
                                                    ? "Ready to spin"
                                                    : `${wheel.selectedIds.length}/${wheel.targetCount} selected`}
                                            </span>
                                        </div>

                                        <div className="relative">
                                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(
                                                    e: Readonly<{ currentTarget: Readonly<{ value: string }> }>,
                                                ) => {
                                                    setSearchQuery(e.currentTarget.value)
                                                }}
                                                placeholder="Search restaurants..."
                                                aria-label="Search restaurants"
                                                className="w-full rounded-lg border border-stone-200 bg-surface py-2 pr-3 pl-9 text-sm text-stone-900 placeholder:text-stone-400 focus:border-tomato-500 focus:outline-none"
                                            />
                                            {searchQuery && (
                                                <button
                                                    onClick={() => {
                                                        setSearchQuery("")
                                                    }}
                                                    className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                                                    aria-label="Clear search"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-52 overflow-y-auto rounded-lg border border-stone-200 bg-surface">
                                            {filteredRestaurants.map((restaurant) => {
                                                const isSelected = wheel.selectedIds.includes(restaurant._id)
                                                return (
                                                    <label
                                                        key={restaurant._id}
                                                        className={cx(
                                                            "flex cursor-pointer items-center gap-3 border-b border-stone-100 px-4 py-3 transition-colors last:border-b-0",
                                                            isSelected ? "bg-tomato-50" : "hover:bg-stone-50",
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                wheel.toggleRestaurantSelection(restaurant._id)
                                                            }}
                                                            className="size-4 rounded border-stone-300 text-tomato-700 focus:ring-tomato-700"
                                                        />
                                                        <span
                                                            className={cx(
                                                                "text-sm",
                                                                isSelected
                                                                    ? "font-medium text-tomato-700"
                                                                    : "text-stone-700",
                                                            )}
                                                        >
                                                            {restaurant.name}
                                                        </span>
                                                    </label>
                                                )
                                            })}
                                        </div>

                                        {filteredRestaurants.length === 0 && (
                                            <p className="py-4 text-center text-sm text-stone-500">
                                                No restaurants match your search
                                            </p>
                                        )}

                                        {(wheel.selectedIds.length === 0 ||
                                            (wheel.selectedIds.length > 0 &&
                                                wheel.selectedIds.length < wheel.targetCount)) &&
                                            filteredRestaurants.length > 0 && (
                                                <p className="text-xs text-amber-600">
                                                    {wheel.selectedIds.length === 0
                                                        ? "Please select at least 1 restaurant to spin"
                                                        : `You can add ${wheel.targetCount - wheel.selectedIds.length} more optional selections`}
                                                </p>
                                            )}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => {
                                    onOpenChange(false)
                                }}
                            >
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
