import { For } from "solid-js"
import type { OpeningHours } from "@core/hooks"

const DAYS = ["S", "M", "T", "W", "T", "F", "S"]

export function OpeningHoursDayRow(props: { openingHours: OpeningHours | undefined; size?: "sm" | "lg" }) {
    const isClosed = (dayIndex: number) => {
        if (!props.openingHours?.periods) return false
        return !props.openingHours.periods.some((p) => p.day === dayIndex)
    }

    const isToday = (dayIndex: number) => {
        return dayIndex === new Date().getDay()
    }

    const sizeClasses = () => (props.size === "lg" ? "size-8 text-lg" : "size-5 text-xs")

    return (
        <div class="flex gap-1">
            <For each={DAYS}>
                {(day, index) => (
                    <span
                        classList={{
                            [sizeClasses()]: true,
                            "flex items-center justify-center rounded": true,
                            "text-neutral-400 dark:text-neutral-600": isClosed(index()),
                            "text-neutral-900 dark:text-neutral-100": !isClosed(index()),
                            "ring-primary-500 ring-2": isToday(index()),
                        }}
                    >
                        {day}
                    </span>
                )}
            </For>
        </div>
    )
}
