import { createMemo, Show } from "solid-js"
import Clock from "lucide-solid/icons/clock"
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

export function OpeningHours(props: { openingHours: OpeningHours | undefined; onClick?: () => void }) {
    const openNow = createMemo(() => {
        if (!props.openingHours) return false
        return isOpenNow(props.openingHours)
    })

    const todayIndex = createMemo(() => {
        const day = new Date().getDay()
        return day === 0 ? 6 : day - 1
    })

    const todayText = createMemo(() => {
        const texts = props.openingHours?.weekdayText
        if (!texts || texts.length === 0) return ""
        const index = todayIndex()
        return texts[index] ?? ""
    })

    const todayDayName = createMemo(() => {
        const text = todayText()
        if (!text) return ""
        return text.split(":")[0] ?? ""
    })

    const todayHours = createMemo(() => {
        const text = todayText()
        if (!text) return ""
        return text.split(": ")[1] ?? ""
    })

    return (
        <Show when={props.openingHours?.weekdayText && props.openingHours.weekdayText.length > 0}>
            <button
                type="button"
                onClick={props.onClick}
                class="flex w-full items-center gap-2 text-left transition-opacity hover:opacity-80"
            >
                <div class="flex size-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <Clock class="size-3.5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                </div>
                <div class="flex items-center gap-2 text-sm">
                    <span
                        class={`font-medium ${openNow() ? "text-flame-pea-600 dark:text-flame-pea-400" : "text-neutral-500 dark:text-neutral-400"}`}
                    >
                        {openNow() ? "Open now" : "Closed"}
                    </span>
                    <span class="text-neutral-300 dark:text-neutral-600">·</span>
                    <span class="text-neutral-600 dark:text-neutral-300">
                        {todayDayName()} {todayHours()}
                    </span>
                </div>
            </button>
        </Show>
    )
}
