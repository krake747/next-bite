export type OpeningHours = {
    readonly openState: "open" | "closed" | "unknown"
    readonly periods: ReadonlyArray<
        Readonly<{
            readonly day: number
            readonly openTime: string
            readonly closeTime: string
        }>
    >
    readonly weekdayText: ReadonlyArray<string>
}

function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":")
    return parseInt(hours ?? "0", 10) * 60 + parseInt(minutes ?? "0", 10)
}

export function isOpenNow(openingHours: Readonly<OpeningHours> | undefined): boolean {
    if (openingHours === undefined) {
        return false
    }
    if (openingHours.openState === "open") {
        return true
    }
    if (openingHours.openState === "closed") {
        return false
    }
    const now = new Date()
    const period = openingHours.periods?.find((p) => p.day === now.getDay())
    if (!period) {
        return false
    }
    const currentTime = now.getHours() * 60 + now.getMinutes()
    return currentTime >= parseTimeToMinutes(period.openTime) && currentTime <= parseTimeToMinutes(period.closeTime)
}

export function todayIndex(date: Readonly<Date> = new Date()): number {
    const day = date.getDay()
    return day === 0 ? 6 : day - 1
}

export function openStatusLabel(openingHours: Readonly<OpeningHours> | undefined): string {
    return isOpenNow(openingHours) ? "Open now" : "Closed"
}

export function parseDayText(dayText: string): { day: string; hours: string } {
    const separator = dayText.indexOf(": ")
    if (separator === -1) {
        return { day: dayText, hours: "" }
    }
    return { day: dayText.slice(0, separator), hours: dayText.slice(separator + 2) }
}

export function todayText(openingHours: Readonly<OpeningHours> | undefined): string {
    const weekdayText = openingHours?.weekdayText
    if (weekdayText === undefined || weekdayText.length === 0) {
        return ""
    }
    return weekdayText[todayIndex()] ?? ""
}

export function orderedWeek(openingHours: Readonly<OpeningHours> | undefined): ReadonlyArray<string> {
    const weekdayText = openingHours?.weekdayText
    if (weekdayText === undefined || weekdayText.length === 0) {
        return []
    }
    const [first, ...rest] = weekdayText
    return first !== undefined && first !== "" ? [...rest, first] : [...rest]
}
