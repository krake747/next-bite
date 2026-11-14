import * as valibot from "valibot"

import { type OpeningHoursData } from "./hours"

export type PlaceDetailsTier = "atmosphere" | "combined"

export const PRO_FIELD_MASK = [
    "displayName",
    "primaryType",
    "googleMapsUri",
    "businessStatus",
    "utcOffsetMinutes",
] as const

export const ENTERPRISE_FIELD_MASK = [
    "currentOpeningHours",
    "priceLevel",
    "rating",
    "userRatingCount",
    "websiteUri",
] as const

export const COMBINED_FIELD_MASK = [...PRO_FIELD_MASK, ...ENTERPRISE_FIELD_MASK] as const

export const ATMOSPHERE_FIELD_MASK = [
    ...ENTERPRISE_FIELD_MASK,
    "editorialSummary",
    "reviewSummary",
    "servesVegetarianFood",
    "goodForGroups",
    "reservable",
] as const

export const PLACE_FIELD_MASKS: Record<PlaceDetailsTier, ReadonlyArray<string>> = {
    atmosphere: [...ATMOSPHERE_FIELD_MASK],
    combined: [...COMBINED_FIELD_MASK],
}

export type PlaceProDetails = {
    readonly displayName?: string
    readonly primaryType?: string
    readonly googleMapsUri?: string
    readonly businessStatus?: string
    readonly utcOffsetMinutes?: number
}

export type PlaceEnterpriseDetails = {
    readonly openingHours: OpeningHoursData
    readonly rating?: number
    readonly ratingCount?: number
    readonly priceLevel?: string
    readonly websiteUri?: string
}

export type PlaceAtmosphereDetails = PlaceEnterpriseDetails & {
    readonly editorialSummary?: string
    readonly reviewSummary?: string
    readonly servesVegetarianFood?: boolean
    readonly goodForGroups?: boolean
    readonly reservable?: boolean
}

export type PlaceCombinedDetails = PlaceProDetails & PlaceEnterpriseDetails

export type PlaceDetailsResult = PlaceCombinedDetails | PlaceAtmosphereDetails

type GoogleOpeningHours = {
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
}

const googleDetailsSchema = valibot.object({
    displayName: valibot.optional(
        valibot.object({
            text: valibot.optional(valibot.string()),
        }),
    ),
    primaryType: valibot.optional(valibot.string()),
    googleMapsUri: valibot.optional(valibot.string()),
    businessStatus: valibot.optional(valibot.string()),
    utcOffsetMinutes: valibot.optional(valibot.number()),
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
    priceLevel: valibot.optional(valibot.string()),
    rating: valibot.optional(valibot.number()),
    userRatingCount: valibot.optional(valibot.number()),
    websiteUri: valibot.optional(valibot.string()),
    editorialSummary: valibot.optional(
        valibot.union([
            valibot.string(),
            valibot.object({
                text: valibot.optional(valibot.string()),
            }),
        ]),
    ),
    reviewSummary: valibot.optional(
        valibot.union([
            valibot.string(),
            valibot.object({
                text: valibot.optional(
                    valibot.union([valibot.string(), valibot.object({ text: valibot.optional(valibot.string()) })]),
                ),
            }),
        ]),
    ),
    servesVegetarianFood: valibot.optional(valibot.boolean()),
    goodForGroups: valibot.optional(valibot.boolean()),
    reservable: valibot.optional(valibot.boolean()),
})

type GoogleDetails = valibot.InferOutput<typeof googleDetailsSchema>

function toOpeningHours(google: GoogleOpeningHours | undefined): OpeningHoursData {
    if (google === undefined) {
        return { openState: "unknown", periods: [], weekdayText: [] }
    }
    const openState = google.openNow === true ? "open" : google.openNow === false ? "closed" : "unknown"
    const periods: { day: number; openTime: string; closeTime: string }[] = []
    const seen = new Set<number>()
    for (const period of google.periods ?? []) {
        const day = period.open?.day
        if (day === undefined || seen.has(day)) {
            continue
        }
        periods.push({
            day,
            openTime: `${(period.open?.hour ?? 0).toString().padStart(2, "0")}:${(period.open?.minute ?? 0).toString().padStart(2, "0")}`,
            closeTime: `${(period.close?.hour ?? 0).toString().padStart(2, "0")}:${(period.close?.minute ?? 0).toString().padStart(2, "0")}`,
        })
        seen.add(day)
    }
    return { openState, periods, weekdayText: [...(google.weekdayDescriptions ?? [])] }
}

function textOf(value: string | { readonly text?: string | undefined } | undefined): string | undefined {
    if (value === undefined) {
        return undefined
    }
    if (typeof value === "string") {
        const trimmed = value.trim()
        return trimmed === "" ? undefined : trimmed
    }
    const trimmed = value.text?.trim() ?? ""
    return trimmed === "" ? undefined : trimmed
}

function reviewTextOf(value: GoogleDetails["reviewSummary"]): string | undefined {
    if (value === undefined) {
        return undefined
    }
    if (typeof value === "string") {
        const trimmed = value.trim()
        return trimmed === "" ? undefined : trimmed
    }
    const inner = value.text
    if (inner === undefined) {
        return undefined
    }
    if (typeof inner === "string") {
        const trimmed = inner.trim()
        return trimmed === "" ? undefined : trimmed
    }
    return textOf(inner)
}

function toProDetails(google: GoogleDetails): PlaceProDetails {
    const out: {
        displayName?: string
        primaryType?: string
        googleMapsUri?: string
        businessStatus?: string
        utcOffsetMinutes?: number
    } = {}
    const name = google.displayName?.text?.trim()
    if (name !== undefined && name !== "") {
        out.displayName = name
    }
    if (google.primaryType !== undefined) {
        out.primaryType = google.primaryType
    }
    if (google.googleMapsUri !== undefined) {
        out.googleMapsUri = google.googleMapsUri
    }
    if (google.businessStatus !== undefined) {
        out.businessStatus = google.businessStatus
    }
    if (google.utcOffsetMinutes !== undefined) {
        out.utcOffsetMinutes = google.utcOffsetMinutes
    }
    return out
}

function toEnterpriseDetails(google: GoogleDetails): PlaceEnterpriseDetails {
    const out: {
        openingHours: OpeningHoursData
        rating?: number
        ratingCount?: number
        priceLevel?: string
        websiteUri?: string
    } = { openingHours: toOpeningHours(google.currentOpeningHours) }
    if (google.rating !== undefined) {
        out.rating = google.rating
    }
    if (google.userRatingCount !== undefined) {
        out.ratingCount = google.userRatingCount
    }
    if (google.priceLevel !== undefined) {
        out.priceLevel = google.priceLevel
    }
    if (google.websiteUri !== undefined && google.websiteUri !== "") {
        out.websiteUri = google.websiteUri
    }
    return out
}

function toAtmosphereDetails(google: GoogleDetails): PlaceAtmosphereDetails {
    const base = toEnterpriseDetails(google)
    const editorial = textOf(google.editorialSummary)
    const review = reviewTextOf(google.reviewSummary)
    return {
        ...base,
        ...(editorial !== undefined ? { editorialSummary: editorial } : {}),
        ...(review !== undefined ? { reviewSummary: review } : {}),
        ...(google.servesVegetarianFood !== undefined ? { servesVegetarianFood: google.servesVegetarianFood } : {}),
        ...(google.goodForGroups !== undefined ? { goodForGroups: google.goodForGroups } : {}),
        ...(google.reservable !== undefined ? { reservable: google.reservable } : {}),
    }
}

const inflight = new Map<string, Promise<PlaceDetailsResult>>()

function fallbackFor(): PlaceDetailsResult {
    return { openingHours: { openState: "unknown", periods: [], weekdayText: [] } }
}

async function fetchTier(placeId: string, apiKey: string, tier: PlaceDetailsTier): Promise<PlaceDetailsResult> {
    const mask = PLACE_FIELD_MASKS[tier].join(",")
    try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=${mask}`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": mask,
            },
        })
        if (!response.ok) {
            await response.text()
            return fallbackFor()
        }
        const google: GoogleDetails = valibot.parse(googleDetailsSchema, await response.json())
        if (tier === "combined") {
            return { ...toProDetails(google), ...toEnterpriseDetails(google) }
        }
        return toAtmosphereDetails(google)
    } catch {
        return fallbackFor()
    }
}

export async function fetchPlaceDetails(
    placeId: string,
    apiKey: string | undefined,
    tier: PlaceDetailsTier,
): Promise<PlaceDetailsResult> {
    if (placeId === "" || apiKey === undefined) {
        return fallbackFor()
    }
    const key = `${tier}:${placeId}`
    const running = inflight.get(key)
    if (running !== undefined) {
        return running
    }
    const task = fetchTier(placeId, apiKey, tier).finally(() => {
        inflight.delete(key)
    })
    inflight.set(key, task)
    return task
}
