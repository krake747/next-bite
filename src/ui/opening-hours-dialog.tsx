import { ClockIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"
import { type OpeningHours } from "@ui/opening-hours-utils"
import { isOpenNow, openStatusLabel, orderedWeek, parseDayText, todayIndex } from "@ui/opening-hours-utils"

import { Badge } from "./badge"
import { Dialog, DialogContent, DialogTitle } from "./dialog"

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
    const openNow = isOpenNow(openingHours)

    const fullWeek = orderedWeek(openingHours)

    const currentToday = todayIndex()

    return (
        <Dialog open={show} onOpenChange={onOpenChange}>
            <DialogContent size="sm" padding="sm">
                <DialogTitle className="mb-4 flex items-center gap-2">
                    <ClockIcon className="size-5 text-tomato-500" />
                    Hours
                </DialogTitle>

                <p className="mb-4 text-sm text-stone-600">{restaurantName}</p>

                <div className="mb-5 flex items-center gap-2">
                    <Badge tone={openNow ? "success" : "neutral"}>{openStatusLabel(openingHours)}</Badge>
                </div>

                <div className="flex flex-col gap-2">
                    {fullWeek.map((dayText, index) => {
                        const { day, hours } = parseDayText(dayText)
                        const isToday = index === currentToday
                        return (
                            <div
                                key={day}
                                className={cx(
                                    "flex items-center justify-between gap-2 border-b border-border py-1.5 text-sm",
                                    isToday && "font-medium",
                                )}
                            >
                                <span className={isToday ? "text-stone-900" : "text-stone-600"}>
                                    {isToday ? "Today" : day}
                                </span>
                                <span className="text-stone-600">{hours}</span>
                            </div>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
