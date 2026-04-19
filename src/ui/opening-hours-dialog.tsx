import { createMemo, For } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import Clock from "lucide-solid/icons/clock"
import X from "lucide-solid/icons/x"
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

export function OpeningHoursDialog(props: {
    show: boolean
    onOpenChange: (open: boolean) => void
    openingHours: OpeningHours | undefined
    restaurantName: string
}) {
    const openNow = createMemo(() => {
        if (!props.openingHours) return false
        return isOpenNow(props.openingHours)
    })

    const fullWeek = createMemo(() => {
        if (!props.openingHours?.weekdayText) return []
        const texts = [...props.openingHours.weekdayText]
        const mondayOnwards = texts.slice(1)
        const sundayText = texts[0]
        if (sundayText) mondayOnwards.push(sundayText)
        return mondayOnwards
    })

    const today = createMemo(() => {
        const day = new Date().getDay()
        return day === 0 ? 6 : day - 1
    })

    return (
        <Dialog open={props.show} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Content class="relative w-full max-w-sm overflow-y-auto rounded-2xl border border-neutral-200/60 bg-[#faf9f7]/95 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-[#1a1918]/95 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
                        <Dialog.Title
                            class="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-white"
                            style={{ "font-family": "var(--font-display)" }}
                        >
                            <Clock class="size-5 text-flame-pea-500" />
                            Hours
                        </Dialog.Title>

                        <p class="mb-4 text-sm text-neutral-500 dark:text-neutral-400">{props.restaurantName}</p>

                        <div class="mb-5 flex items-center gap-2">
                            <span
                                class={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${openNow() ? "bg-flame-pea-100 text-flame-pea-700 dark:bg-flame-pea-950/50 dark:text-flame-pea-400" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400"}`}
                            >
                                {openNow() ? "Open now" : "Closed"}
                            </span>
                        </div>

                        <div class="space-y-2">
                            <For each={fullWeek()}>
                                {(dayText, index) => {
                                    const parts = dayText.split(": ")
                                    const day = parts[0] ?? ""
                                    const hours = parts[1] ?? ""
                                    const dayNum = index()
                                    const isToday = dayNum === today()
                                    return (
                                        <div
                                            class={`flex items-center justify-between border-b border-neutral-100 py-1.5 text-sm dark:border-neutral-800 ${isToday ? "font-medium" : ""}`}
                                        >
                                            <span
                                                class={
                                                    isToday
                                                        ? "text-neutral-900 dark:text-neutral-100"
                                                        : "text-neutral-600 dark:text-neutral-400"
                                                }
                                            >
                                                {isToday ? "Today" : day}
                                            </span>
                                            <span class="text-neutral-600 dark:text-neutral-400">{hours}</span>
                                        </div>
                                    )
                                }}
                            </For>
                        </div>

                        <button
                            type="button"
                            onClick={() => props.onOpenChange(false)}
                            class="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                        >
                            <X class="size-4" />
                            <span class="sr-only">Close</span>
                        </button>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog>
    )
}
