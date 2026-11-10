import { describe, expect, test } from "vitest"

import { orderedWeek, todayIndex, todayText, type OpeningHours } from "./opening-hours-utils"

const mondayFirst: OpeningHours = {
    openState: "unknown",
    periods: [],
    weekdayText: [
        "Monday: 9:00 AM – 5:00 PM",
        "Tuesday: 9:00 AM – 5:00 PM",
        "Wednesday: 9:00 AM – 5:00 PM",
        "Thursday: 9:00 AM – 5:00 PM",
        "Friday: 9:00 AM – 5:00 PM",
        "Saturday: 10:00 AM – 2:00 PM",
        "Sunday: Closed",
    ],
}

const monday = new Date(2026, 10, 9)
const sunday = new Date(2026, 10, 15)

describe("opening-hours week ordering", () => {
    test("todayIndex is Monday-first", () => {
        expect(todayIndex(monday)).toBe(0)
        expect(todayIndex(sunday)).toBe(6)
    })

    test("todayText and orderedWeek agree on which entry is today", () => {
        expect(todayText(mondayFirst, monday)).toBe("Monday: 9:00 AM – 5:00 PM")
        expect(todayText(mondayFirst, sunday)).toBe("Sunday: Closed")
        const week = orderedWeek(mondayFirst)
        expect(week[todayIndex(monday)]).toBe("Monday: 9:00 AM – 5:00 PM")
        expect(week[todayIndex(sunday)]).toBe("Sunday: Closed")
    })
})
