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

export type GoogleOpeningHoursInput = GoogleOpeningHours

export function openFallback(): OpeningHoursData {
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

function periodRow(period: {
    readonly open?:
        | {
              readonly day?: number | undefined
              readonly hour?: number | undefined
              readonly minute?: number | undefined
          }
        | undefined
    readonly close?:
        | {
              readonly day?: number | undefined
              readonly hour?: number | undefined
              readonly minute?: number | undefined
          }
        | undefined
}): OpeningHoursData["periods"][number] | undefined {
    const day = period.open?.day
    if (day === undefined) {
        return undefined
    }
    return {
        day,
        openTime: formatTimeOfDay(period.open?.hour, period.open?.minute),
        closeTime: formatTimeOfDay(period.close?.hour, period.close?.minute),
    }
}

export function toOpeningHoursData(google: {
    readonly openNow?: boolean | undefined
    readonly periods?:
        | ReadonlyArray<{
              readonly open?:
                  | {
                        readonly day?: number | undefined
                        readonly hour?: number | undefined
                        readonly minute?: number | undefined
                    }
                  | undefined
              readonly close?:
                  | {
                        readonly day?: number | undefined
                        readonly hour?: number | undefined
                        readonly minute?: number | undefined
                    }
                  | undefined
          }>
        | undefined
    readonly weekdayDescriptions?: ReadonlyArray<string> | undefined
}): OpeningHoursData {
    const periods: OpeningHoursData["periods"] = []
    const seenDays = new Set<number>()

    for (const period of google.periods ?? []) {
        const row = periodRow(period)
        if (row === undefined || seenDays.has(row.day)) {
            continue
        }
        periods.push(row)
        seenDays.add(row.day)
    }

    return {
        openState: toOpenState(google.openNow),
        periods,
        weekdayText: [...(google.weekdayDescriptions ?? [])],
    }
}
