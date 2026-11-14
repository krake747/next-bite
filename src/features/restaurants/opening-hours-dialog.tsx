import { ClockIcon } from "@phosphor-icons/react"

import { GoogleAttribution } from "@pattern/google-attribution"
import { LoadingPlaceholder } from "@pattern/loading"
import { Badge } from "@ui/badge"
import { cx } from "@ui/cva.config"
import { Dialog, DialogContent, DialogTitle } from "@ui/dialog"

import { type OpeningHours } from "./opening-hours-utils"
import { isOpenNow, openStatusLabel, orderedWeek, parseDayText, todayIndex } from "./opening-hours-utils"

export function OpeningHoursDialog({
    show,
    onOpenChange,
    openingHours,
    failed,
    restaurantName,
}: Readonly<{
    show: boolean
    onOpenChange: (open: boolean) => void
    openingHours: OpeningHours | undefined
    failed: boolean
    restaurantName: string
}>) {
    const openNow = isOpenNow(openingHours)

    const fullWeek = orderedWeek(openingHours)

    const currentToday = todayIndex()

    return (
        <Dialog open={show} onOpenChange={onOpenChange}>
            <DialogContent size="sm" padding="sm">
                <DialogTitle className="mb-4">
                    <span className="flex items-center gap-2">
                        <ClockIcon className="size-5 text-tomato-500" />
                        Hours
                    </span>
                </DialogTitle>

                <p className="mb-4 text-sm text-muted-foreground">{restaurantName}</p>

                {failed ? (
                    <p role="alert" className="text-sm text-destructive">
                        Could not load opening hours.
                    </p>
                ) : openingHours === undefined ? (
                    <LoadingPlaceholder />
                ) : (
                    <>
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
                                        <span className={isToday ? "text-foreground" : "text-muted-foreground"}>
                                            {isToday ? "Today" : day}
                                        </span>
                                        <span className="text-muted-foreground">{hours}</span>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-end border-t border-border pt-3">
                            <GoogleAttribution />
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
