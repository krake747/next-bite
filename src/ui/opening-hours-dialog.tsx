import { useMemo } from "react"
import { Dialog } from "@base-ui/react/dialog"
import Clock from "lucide-react/icons/clock"
import X from "lucide-react/icons/x"
import type { OpeningHours } from "@core/hooks"

function isOpenNow(openingHours: OpeningHours): boolean {
    if (openingHours.openNow !== undefined) return openingHours.openNow
    const now = new Date()
    const day = now.getDay()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const periods = openingHours.periods ?? []
    const period = periods.find((p) => p.day === day)
    if (!period) return false
    const openParts = period.openTime.split(":")
    const closeParts = period.closeTime.split(":")
    const open = parseInt(openParts[0] ?? "0", 10) * 60 + parseInt(openParts[1] ?? "0", 10)
    const close = parseInt(closeParts[0] ?? "0", 10) * 60 + parseInt(closeParts[1] ?? "0", 10)
    return currentTime >= open && currentTime <= close
}

export function OpeningHoursDialog({
    show,
    onOpenChange,
    openingHours,
    restaurantName,
}: {
    show: boolean
    onOpenChange: (open: boolean) => void
    openingHours: OpeningHours | undefined
    restaurantName: string
}) {
    const openNow = useMemo(() => {
        if (!openingHours) return false
        return isOpenNow(openingHours)
    }, [openingHours])

    const fullWeek = useMemo(() => {
        if (!openingHours?.weekdayText) return []
        const texts = [...openingHours.weekdayText]
        const mondayOnwards = texts.slice(1)
        const sundayText = texts[0]
        if (sundayText) mondayOnwards.push(sundayText)
        return mondayOnwards
    }, [openingHours])

    const today = useMemo(() => {
        const day = new Date().getDay()
        return day === 0 ? 6 : day - 1
    }, [])

    return (
        <Dialog.Root open={show} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Popup className="relative w-full max-w-sm overflow-y-auto rounded-2xl border border-neutral-200/60 bg-[#faf9f7]/95 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <Dialog.Title
                            className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            <Clock className="size-5 text-flame-pea-500" />
                            Hours
                        </Dialog.Title>

                        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">{restaurantName}</p>

                        <div className="mb-5 flex items-center gap-2">
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${openNow ? "bg-flame-pea-100 text-flame-pea-700 dark:bg-flame-pea-950/50 dark:text-flame-pea-400" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"}`}
                            >
                                {openNow ? "Open now" : "Closed"}
                            </span>
                        </div>

                        <div className="space-y-2">
                            {fullWeek.map((dayText, index) => {
                                const parts = dayText.split(": ")
                                const day = parts[0] ?? ""
                                const hours = parts[1] ?? ""
                                const isToday = index === today
                                return (
                                    <div
                                        key={day}
                                        className={`flex items-center justify-between border-b border-neutral-100 py-1.5 text-sm dark:border-neutral-800 ${isToday ? "font-medium" : ""}`}
                                    >
                                        <span
                                            className={
                                                isToday
                                                    ? "text-neutral-900 dark:text-neutral-100"
                                                    : "text-neutral-600 dark:text-neutral-400"
                                            }
                                        >
                                            {isToday ? "Today" : day}
                                        </span>
                                        <span className="text-neutral-600 dark:text-neutral-400">{hours}</span>
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
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
