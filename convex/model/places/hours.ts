import { type Infer } from "convex/values"
import * as valibot from "valibot"

import { openingHoursValidator } from "../../validators"

export type OpeningHoursData = Infer<typeof openingHoursValidator>

const googleOpeningHoursSchema = valibot.object({
    currentOpeningHours: valibot.optional(
        valibot.object({
            openNow: valibot.optional(valibot.boolean()),
            periods: valibot.optional(
                valibot.array(
                    valibot.object({
                        open: valibot.optional(
                            valibot.object({
                                day: valibot.optional(valibot.number()),
                                hour: valibot.optional(valibot.number()),
                                minute: valibot.optional(valibot.number()),
                            }),
                        ),
                        close: valibot.optional(
                            valibot.object({
                                day: valibot.optional(valibot.number()),
                                hour: valibot.optional(valibot.number()),
                                minute: valibot.optional(valibot.number()),
                            }),
                        ),
                    }),
                ),
            ),
            weekdayDescriptions: valibot.optional(valibot.array(valibot.string())),
        }),
    ),
})

type GoogleOpeningHours = NonNullable<valibot.InferOutput<typeof googleOpeningHoursSchema>["currentOpeningHours"]>

function openFallback(): OpeningHoursData {
    return { openState: "unknown", periods: [], weekdayText: [] }
}

function toOpenState(openNow: boolean | undefined): OpeningHoursData["openState"] {
    if (openNow === true) {
        return "open"
    }
    if (openNow === false) {
        return "closed"
    }
    return "unknown"
}

function formatTimeOfDay(hour: number | undefined, minute: number | undefined): string {
    return `${(hour ?? 0).toString().padStart(2, "0")}:${(minute ?? 0).toString().padStart(2, "0")}`
}

function toOpeningHoursData(google: GoogleOpeningHours): OpeningHoursData {
    const periods: OpeningHoursData["periods"] = []
    const seenDays = new Set<number>()

    for (const period of google.periods ?? []) {
        const day = period.open?.day
        if (day === undefined || seenDays.has(day)) {
            continue
        }
        periods.push({
            day,
            openTime: formatTimeOfDay(period.open?.hour, period.open?.minute),
            closeTime: formatTimeOfDay(period.close?.hour, period.close?.minute),
        })
        seenDays.add(day)
    }

    return {
        openState: toOpenState(google.openNow),
        periods,
        weekdayText: google.weekdayDescriptions ?? [],
    }
}

async function fetchCurrentOpeningHours(placeId: string, apiKey: string): Promise<GoogleOpeningHours | undefined> {
    try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=currentOpeningHours`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "currentOpeningHours",
            },
        })

        if (!response.ok) {
            await response.text()
            return undefined
        }

        const data = valibot.parse(googleOpeningHoursSchema, await response.json())
        return data.currentOpeningHours ?? undefined
    } catch {
        return undefined
    }
}

export async function fetchOpeningHours(placeId: string, apiKey: string | undefined): Promise<OpeningHoursData> {
    if (placeId === "" || apiKey === undefined) {
        return openFallback()
    }
    const google = await fetchCurrentOpeningHours(placeId, apiKey)
    if (google === undefined) {
        return openFallback()
    }
    return toOpeningHoursData(google)
}
