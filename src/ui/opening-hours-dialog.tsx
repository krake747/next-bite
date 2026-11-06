import Clock from "lucide-react/icons/clock"

import { type OpeningHours } from "@core/opening-hours"
import { isOpenNow, openStatusLabel, orderedWeek, parseDayText, todayIndex } from "@core/opening-hours"
import { cx } from "@ui/cva.config"

import { Badge } from "./badge"
import { Dialog, DialogBackdrop, DialogCloseButton, DialogPanel, DialogTitle } from "./dialog"

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
        <Dialog show={show} onOpenChange={onOpenChange}>
            <DialogBackdrop>
                <DialogPanel size="sm" padding="sm">
                    <DialogTitle className="mb-4 flex items-center gap-2">
                        <Clock className="size-5 text-tomato-500" />
                        Hours
                    </DialogTitle>

                    <p className="mb-4 text-sm text-stone-600">{restaurantName}</p>

                    <div className="mb-5 flex items-center gap-2">
                        <Badge variant={openNow ? "success" : "neutral"}>{openStatusLabel(openingHours)}</Badge>
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

                    <DialogCloseButton
                        onClick={() => {
                            onOpenChange(false)
                        }}
                    />
                </DialogPanel>
            </DialogBackdrop>
        </Dialog>
    )
}
