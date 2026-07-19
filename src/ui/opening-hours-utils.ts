import type { OpeningHours } from "@core/hooks"

function parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":")
    return parseInt(hours ?? "0", 10) * 60 + parseInt(minutes ?? "0", 10)
}

export function isOpenNow(openingHours: OpeningHours): boolean {
    if (openingHours.openNow !== undefined) return openingHours.openNow
    const now = new Date()
    const day = now.getDay()
    const currentTime = now.getHours() * 60 + now.getMinutes()
    const period = openingHours.periods?.find((p) => p.day === day)
    if (!period) return false
    const open = parseTimeToMinutes(period.openTime)
    const close = parseTimeToMinutes(period.closeTime)
    return currentTime >= open && currentTime <= close
}
