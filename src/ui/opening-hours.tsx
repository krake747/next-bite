import { useMemo } from "react"
import Clock from "lucide-react/icons/clock"
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

export function OpeningHours({
    openingHours,
    onClick,
}: {
    openingHours: OpeningHours | undefined
    onClick?: () => void
}) {
    const openNow = useMemo(() => {
        if (!openingHours) return false
        return isOpenNow(openingHours)
    }, [openingHours])

    const todayIndex = useMemo(() => {
        const day = new Date().getDay()
        return day === 0 ? 6 : day - 1
    }, [])

    const todayText = useMemo(() => {
        const texts = openingHours?.weekdayText
        if (!texts || texts.length === 0) return ""
        const index = todayIndex
        return texts[index] ?? ""
    }, [openingHours, todayIndex])

    const todayDayName = useMemo(() => {
        const text = todayText
        if (!text) return ""
        return text.split(":")[0] ?? ""
    }, [todayText])

    const todayHours = useMemo(() => {
        const text = todayText
        if (!text) return ""
        return text.split(": ")[1] ?? ""
    }, [todayText])

    if (!openingHours?.weekdayText || openingHours.weekdayText.length === 0) return null

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-2 text-left transition-opacity hover:opacity-80"
        >
            <div className="flex size-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                <Clock className="size-3.5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span
                    className={`font-medium ${openNow ? "text-flame-pea-600 dark:text-flame-pea-400" : "text-neutral-500 dark:text-neutral-400"}`}
                >
                    {openNow ? "Open now" : "Closed"}
                </span>
                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                <span className="text-neutral-600 dark:text-neutral-300">
                    {todayDayName} {todayHours}
                </span>
            </div>
        </button>
    )
}
