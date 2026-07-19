import { cx } from "@ui/variants"
import type { OpeningHours } from "@core/hooks"

const DAYS = ["S", "M", "T", "W", "T", "F", "S"]

export function OpeningHoursDayRow({
    openingHours,
    size = "sm",
}: {
    openingHours: OpeningHours | undefined
    size?: "sm" | "lg"
}) {
    const isClosed = (dayIndex: number) => {
        if (!openingHours?.periods) return false
        return !openingHours.periods.some((p) => p.day === dayIndex)
    }

    const isToday = (dayIndex: number) => {
        return dayIndex === new Date().getDay()
    }

    const sizeClasses = size === "lg" ? "size-8 text-lg" : "size-5 text-xs"

    return (
        <div className="flex gap-1">
            {DAYS.map((day, index) => (
                <span
                    key={index}
                    className={cx(
                        sizeClasses,
                        "flex items-center justify-center rounded",
                        isClosed(index)
                            ? "text-neutral-400 dark:text-neutral-600"
                            : "text-neutral-900 dark:text-neutral-100",
                        isToday(index) && "ring-primary-500 ring-2",
                    )}
                >
                    {day}
                </span>
            ))}
        </div>
    )
}
