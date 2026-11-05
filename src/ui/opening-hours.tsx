import Clock from "lucide-react/icons/clock"

import { type OpeningHours as OpeningHoursData } from "@core/hooks"

import { isOpenNow } from "./opening-hours-utils"

export function OpeningHours({
    openingHours,
    onClick,
}: Readonly<{
    openingHours: OpeningHoursData | undefined
    onClick?: () => void
}>) {
    const openNow = openingHours !== undefined ? isOpenNow(openingHours) : false

    const weekdayText = openingHours?.weekdayText
    if (weekdayText === undefined || weekdayText.length === 0) {
        return null
    }

    const day = new Date().getDay()
    const todayIndex = day === 0 ? 6 : day - 1

    const dayText = weekdayText[todayIndex] ?? ""
    const todayDayName = dayText.split(":")[0] ?? ""
    const todayHours = dayText.split(": ")[1] ?? ""

    return (
        <button
            type="button"
            onClick={onClick}
            className="flex w-full items-center gap-2 text-left transition-opacity hover:opacity-80"
        >
            <div className="flex size-6 items-center justify-center rounded-full bg-stone-100">
                <Clock className="size-3.5 text-stone-400" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span className={`font-medium ${openNow ? "text-tomato-600" : "text-stone-500"}`}>
                    {openNow ? "Open now" : "Closed"}
                </span>
                <span className="text-stone-300">·</span>
                <span className="text-stone-600">
                    {todayDayName} {todayHours}
                </span>
            </div>
        </button>
    )
}
