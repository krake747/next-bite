import * as valibot from "valibot"

import { fixtureCombinedDetails, type FixtureOptions } from "./fixtures"
import { openFallback, toOpeningHoursData, type OpeningHoursData } from "./hours"

export type PlaceDetailsTier = "enterprise" | "pro"

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

export const PLACE_FIELD_MASKS: Record<PlaceDetailsTier, ReadonlyArray<string>> = {
    enterprise: [...ENTERPRISE_FIELD_MASK],
    pro: [...PRO_FIELD_MASK],
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

export type PlaceDetailsResult = PlaceProDetails | PlaceEnterpriseDetails

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
})

type GoogleDetails = valibot.InferOutput<typeof googleDetailsSchema>

function toOpeningHours(google: GoogleOpeningHours | undefined): OpeningHoursData {
    if (google === undefined) {
        return openFallback()
    }
    return toOpeningHoursData(google)
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

const inflight = new Map<string, Promise<PlaceDetailsResult>>()

function fallbackFor(tier: PlaceDetailsTier): PlaceDetailsResult {
    if (tier === "enterprise") {
        return { openingHours: { openState: "unknown", periods: [], weekdayText: [] } }
    }
    return {}
}

export function isMeaningfulResult(result: PlaceDetailsResult): boolean {
    if ("openingHours" in result) {
        return (
            result.rating !== undefined ||
            result.ratingCount !== undefined ||
            result.priceLevel !== undefined ||
            result.websiteUri !== undefined ||
            result.openingHours.openState !== "unknown" ||
            result.openingHours.periods.length > 0 ||
            result.openingHours.weekdayText.length > 0
        )
    }
    if ("businessStatus" in result || "displayName" in result) {
        return (
            "displayName" in result ||
            "primaryType" in result ||
            "googleMapsUri" in result ||
            "businessStatus" in result ||
            "utcOffsetMinutes" in result
        )
    }
    return false
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
            return fallbackFor(tier)
        }
        const google: GoogleDetails = valibot.parse(googleDetailsSchema, await response.json())
        if (tier === "pro") {
            return toProDetails(google)
        }
        return toEnterpriseDetails(google)
    } catch {
        return fallbackFor(tier)
    }
}

export async function fetchPlaceDetails(
    placeId: string,
    apiKey: string | undefined,
    tier: PlaceDetailsTier,
    options: FixtureOptions = {},
): Promise<PlaceDetailsResult> {
    if (placeId === "") {
        return fallbackFor(tier)
    }
    if (options.fixtures === true) {
        const google = valibot.parse(googleDetailsSchema, fixtureCombinedDetails)
        if (tier === "pro") {
            return toProDetails(google)
        }
        return toEnterpriseDetails(google)
    }
    if (apiKey === undefined) {
        return fallbackFor(tier)
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
