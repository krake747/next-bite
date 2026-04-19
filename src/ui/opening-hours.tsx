import { createSignal, createMemo, Show, For } from "solid-js"
import { Collapsible } from "@kobalte/core/collapsible"
import ChevronDown from "lucide-solid/icons/chevron-down"
import Clock from "lucide-solid/icons/clock"
import type { OpeningHours } from "@core/hooks"

const DAY_ABBREV = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

function formatTime12h(time: string): string {
    const parts = time.split(":")
    const hours = parts[0] ?? "0"
    const minutes = parts[1] ?? "0"
    return `${hours}:${minutes}`
}

function getTodayText(openingHours: OpeningHours): string {
    const today = new Date().getDay()
    const dayIndex = today === 0 ? 6 : today - 1
    const periods = openingHours.periods ?? []
    const period = periods.find((p) => p.day === dayIndex)

    if (!period) return "Closed"

    return `${DAY_ABBREV[dayIndex]} ${formatTime12h(period.openTime)}−${formatTime12h(period.closeTime)}`
}

function formatWeekdayText(text: string): string {
    return text.replace(": ", ": ").replace(" AM", " AM").replace(" PM", " PM")
}

export function OpeningHours(props: { openingHours: OpeningHours | undefined; showWhenCollapsed?: boolean }) {
    const [isOpen, setIsOpen] = createSignal(false)

    const todayText = createMemo(() => {
        if (!props.openingHours) return ""
        return getTodayText(props.openingHours)
    })

    const weekdayList = createMemo(() => {
        if (!props.openingHours?.weekdayText) return []
        const today = new Date().getDay()
        const startDay = today === 0 ? 6 : today - 1

        const texts = [...props.openingHours.weekdayText]
        const reordered: string[] = []

        for (let i = 0; i < 7; i++) {
            const index = (startDay + i) % 7
            const text = texts[index]
            if (text) reordered.push(formatWeekdayText(text))
        }

        return reordered
    })

    return (
        <Show when={props.openingHours && todayText()}>
            <Collapsible open={isOpen()} onOpenChange={setIsOpen}>
                <Collapsible.Trigger
                    class="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-neutral-600 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5"
                    title={isOpen() ? "Hide hours" : "Show hours"}
                >
                    <Clock class="size-3.5 shrink-0 text-neutral-500 dark:text-neutral-500" aria-hidden="true" />
                    <span class="flex-1 font-medium">{todayText()}</span>
                    <ChevronDown
                        class="size-3.5 shrink-0 text-neutral-400 transition-transform duration-300 ease-out dark:text-neutral-500"
                        classList={{ "rotate-180": isOpen() }}
                        aria-hidden="true"
                    />
                </Collapsible.Trigger>
                <Collapsible.Content>
                    <div class="mt-2 space-y-1 pl-7">
                        <For each={weekdayList()}>
                            {(day) => (
                                <div class="flex items-center justify-between text-xs">
                                    <span class="font-medium text-neutral-700 dark:text-neutral-300">
                                        {day.split(":")[0]}
                                    </span>
                                    <span class="text-neutral-600 dark:text-neutral-400">
                                        {day.split(":")[1]?.trim() ?? ""}
                                    </span>
                                </div>
                            )}
                        </For>
                    </div>
                </Collapsible.Content>
            </Collapsible>
        </Show>
    )
}
