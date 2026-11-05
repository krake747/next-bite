import { Dialog } from "@base-ui/react/dialog"
import Clock from "lucide-react/icons/clock"
import X from "lucide-react/icons/x"

import { type OpeningHours } from "@core/hooks"

import { isOpenNow } from "./opening-hours-utils"

export function OpeningHoursDialog({
    show,
    onOpenChange,
    openingHours,
    restaurantName,
}: Readonly<{
    show: boolean
    onOpenChange: (open: boolean) => void
    openingHours: OpeningHours | undefined
    restaurantName: string
}>) {
    const openNow = openingHours !== undefined ? isOpenNow(openingHours) : false

    const weekdayText = openingHours?.weekdayText
    const firstDay = weekdayText?.[0]
    const fullWeek =
        weekdayText !== undefined && weekdayText.length > 0
            ? [...weekdayText.slice(1), ...(firstDay !== undefined && firstDay !== "" ? [firstDay] : [])]
            : []

    const dayOfWeek = new Date().getDay()
    const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1

    return (
        <Dialog.Root open={show} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Popup className="relative w-full max-w-sm overflow-y-auto rounded-2xl border border-stone-200/60 bg-background/95 p-5 shadow-popover backdrop-blur-md">
                        <Dialog.Title
                            className="mb-4 flex items-center gap-2 text-lg font-semibold text-stone-900"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            <Clock className="size-5 text-tomato-500" />
                            Hours
                        </Dialog.Title>

                        <p className="mb-4 text-sm text-stone-500">{restaurantName}</p>

                        <div className="mb-5 flex items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${openNow ? "bg-tomato-100 text-tomato-700" : "bg-stone-100 text-stone-600"}`}
                            >
                                {openNow ? "Open now" : "Closed"}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {fullWeek.map((dayText, index) => {
                                const parts = dayText.split(": ")
                                const day = parts[0] ?? ""
                                const hours = parts[1] ?? ""
                                const isToday = index === todayIndex
                                return (
                                    <div
                                        key={day}
                                        className={`flex items-center justify-between border-b border-stone-100 py-1.5 text-sm ${isToday ? "font-medium" : ""}`}
                                    >
                                        <span className={isToday ? "text-stone-900" : "text-stone-600"}>
                                            {isToday ? "Today" : day}
                                        </span>
                                        <span className="text-stone-600">{hours}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                onOpenChange(false)
                            }}
                            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                        >
                            <X className="size-4" />
                            <span className="sr-only">Close</span>
                        </button>
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
