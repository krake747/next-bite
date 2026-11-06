import Clock from "lucide-react/icons/clock"

import {
    isOpenNow,
    openStatusLabel,
    parseDayText,
    todayText,
    type OpeningHours as OpeningHoursData,
} from "@core/opening-hours"
import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export function OpeningHours({
    openingHours,
    onClick,
}: Readonly<{
    openingHours: OpeningHoursData | undefined
    onClick?: () => void
}>) {
    const openNow = isOpenNow(openingHours)

    const dayText = todayText(openingHours)
    if (dayText === "") {
        return null
    }

    const { day: todayDayName, hours: todayHours } = parseDayText(dayText)

    return (
        <button
            type="button"
            onClick={onClick}
            className={cx(
                focusRing(),
                "hit-area-y-1 flex w-full cursor-pointer items-center gap-2 rounded-control text-left transition-opacity duration-150 hover:opacity-80",
            )}
        >
            <div className="flex size-6 items-center justify-center rounded-full bg-stone-100">
                <Clock className="size-3.5 text-stone-400" />
            </div>
            <div className="flex items-center gap-2 text-sm">
                <span className={`font-medium ${openNow ? "text-tomato-600" : "text-stone-600"}`}>
                    {openStatusLabel(openingHours)}
                </span>
                <span className="text-stone-300">·</span>
                <span className="text-stone-600">
                    {todayDayName} {todayHours}
                </span>
            </div>
        </button>
    )
}
