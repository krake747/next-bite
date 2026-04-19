import { createMemo, Show } from "solid-js"
import Clock from "lucide-solid/icons/clock"
import type { OpeningHours } from "@core/hooks"

function formatTime24h(time: string): string {
    const parts = time.split(":")
    return `${parts[0] ?? ""}:${parts[1] ?? ""}`
}

function getTodayHours(openingHours: OpeningHours): string {
    const today = new Date().getDay()
    const periods = openingHours.periods ?? []
    const period = periods.find((p) => p.day === today)
    if (!period) return "Closed"
    return `${formatTime24h(period.openTime)} - ${formatTime24h(period.closeTime)}`
}

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

export function OpeningHours(props: { openingHours: OpeningHours | undefined; onClick?: (() => void) | undefined }) {
    const todayHours = createMemo(() => {
        if (!props.openingHours) return ""
        return getTodayHours(props.openingHours)
    })

    const openNow = createMemo(() => {
        if (!props.openingHours) return false
        return isOpenNow(props.openingHours)
    })

    return (
        <Show when={props.openingHours && todayHours()}>
            <button
                type="button"
                onClick={props.onClick}
                class="flex items-center gap-2 text-sm text-neutral-500 transition-colors duration-200 hover:text-flame-pea-600 dark:text-neutral-400 dark:hover:text-flame-pea-400"
                classList={{ "cursor-pointer": !!props.onClick, "cursor-default": !props.onClick }}
                disabled={!props.onClick}
            >
                <div class="flex size-6 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <Clock class="size-3.5 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
                </div>
                <span class={openNow() ? "text-flame-pea-600 dark:text-flame-pea-400" : ""}>{todayHours()}</span>
            </button>
        </Show>
    )
}
