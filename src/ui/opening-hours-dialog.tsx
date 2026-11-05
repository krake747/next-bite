import Clock from "lucide-react/icons/clock"

import { type OpeningHours } from "@core/hooks"

import { Badge } from "./badge"
import { Dialog, DialogBackdrop, DialogCloseButton, DialogPanel, DialogTitle } from "./dialog"
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
        <Dialog show={show} onOpenChange={onOpenChange}>
            <DialogBackdrop>
                <DialogPanel size="sm" padding="sm">
                    <DialogTitle className="mb-4 flex items-center gap-2">
                        <Clock className="size-5 text-tomato-500" />
                        Hours
                    </DialogTitle>

                    <p className="mb-4 text-sm text-stone-500">{restaurantName}</p>

                    <div className="mb-5 flex items-center gap-2">
                        <Badge variant={openNow ? "success" : "neutral"}>{openNow ? "Open now" : "Closed"}</Badge>
                    </div>

                    <div className="flex flex-col gap-2">
                        {fullWeek.map((dayText, index) => {
                            const parts = dayText.split(": ")
                            const day = parts[0] ?? ""
                            const hours = parts[1] ?? ""
                            const isToday = index === todayIndex
                            return (
                                <div
                                    key={day}
                                    className={`flex items-center justify-between gap-2 border-b border-border py-1.5 text-sm ${isToday ? "font-medium" : ""}`}
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
                        onClose={() => {
                            onOpenChange(false)
                        }}
                    />
                </DialogPanel>
            </DialogBackdrop>
        </Dialog>
    )
}
