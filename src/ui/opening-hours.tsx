import Clock from "lucide-react/icons/clock"

import type { OpeningHours } from "@core/hooks"

import { isOpenNow } from "./opening-hours-utils"

export function OpeningHours({
    openingHours,
    onClick,
}: {
    openingHours: OpeningHours | undefined
    onClick?: () => void
}) {
    const openNow = openingHours ? isOpenNow(openingHours) : false

    const todayIndex = (() => {
        const day = new Date().getDay()
        return day === 0 ? 6 : day - 1
    })()

    const texts = openingHours?.weekdayText
    const todayText = texts && texts.length > 0 ? (texts[todayIndex] ?? "") : ""

    const todayDayName = todayText ? (todayText.split(":")[0] ?? "") : ""

    const todayHours = todayText ? (todayText.split(": ")[1] ?? "") : ""

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
