import { type Infer } from "convex/values"
import * as valibot from "valibot"

import { atmosphereValidator } from "../../validators"
import { fixtureAtmosphere, type FixtureOptions } from "./fixtures"

export type AtmosphereData = Infer<typeof atmosphereValidator>

// Field masks from the Places spike in #199. The tiered details action and
// Atmosphere mask land via #228; this module owns the Atmosphere fetch shape
// so #228 can reuse the masks without a competing action.
export const PRO_MASK = "displayName,primaryType,formattedAddress,googleMapsUri"
export const ENTERPRISE_MASK = `${PRO_MASK},currentOpeningHours,rating,userRatingCount,priceLevel,websiteUri`
export const ATMOSPHERE_MASK = `${ENTERPRISE_MASK},editorialSummary,reviewSummary,servesVegetarianFood,goodForGroups,reservable`

const localizedTextSchema = valibot.object({
    text: valibot.optional(valibot.string()),
    languageCode: valibot.optional(valibot.string()),
})

const googleAtmosphereSchema = valibot.object({
    editorialSummary: valibot.optional(localizedTextSchema),
    reviewSummary: valibot.optional(
        valibot.object({
            text: valibot.optional(localizedTextSchema),
            disclosureText: valibot.optional(localizedTextSchema),
            flagContentUri: valibot.optional(valibot.string()),
            reviewsUri: valibot.optional(valibot.string()),
        }),
    ),
    servesVegetarianFood: valibot.optional(valibot.boolean()),
    goodForGroups: valibot.optional(valibot.boolean()),
    reservable: valibot.optional(valibot.boolean()),
})

function emptyAtmosphere(): AtmosphereData {
    return {}
}

type GoogleAtmosphere = valibot.InferOutput<typeof googleAtmosphereSchema>

function toEditorialSummary(parsed: GoogleAtmosphere): AtmosphereData["editorialSummary"] {
    const text = parsed.editorialSummary?.text
    if (text === undefined || text === "") {
        return undefined
    }
    return {
        text,
        ...(parsed.editorialSummary?.languageCode !== undefined
            ? { languageCode: parsed.editorialSummary.languageCode }
            : {}),
    }
}

function toReviewSummary(parsed: GoogleAtmosphere): AtmosphereData["reviewSummary"] {
    if (parsed.reviewSummary === undefined) {
        return undefined
    }
    const text = parsed.reviewSummary.text?.text
    const disclosureText = parsed.reviewSummary.disclosureText?.text
    return {
        ...(text !== undefined ? { text } : {}),
        ...(disclosureText !== undefined ? { disclosureText } : {}),
        ...(parsed.reviewSummary.flagContentUri !== undefined
            ? { flagContentUri: parsed.reviewSummary.flagContentUri }
            : {}),
        ...(parsed.reviewSummary.reviewsUri !== undefined ? { reviewsUri: parsed.reviewSummary.reviewsUri } : {}),
    }
}

function toAtmosphereData(parsed: GoogleAtmosphere): AtmosphereData {
    const editorialSummary = toEditorialSummary(parsed)
    const reviewSummary = toReviewSummary(parsed)
    return {
        ...(editorialSummary !== undefined ? { editorialSummary } : {}),
        ...(reviewSummary !== undefined ? { reviewSummary } : {}),
        ...(parsed.servesVegetarianFood !== undefined ? { servesVegetarianFood: parsed.servesVegetarianFood } : {}),
        ...(parsed.goodForGroups !== undefined ? { goodForGroups: parsed.goodForGroups } : {}),
        ...(parsed.reservable !== undefined ? { reservable: parsed.reservable } : {}),
    }
}

async function fetchAtmosphereFields(placeId: string, apiKey: string): Promise<AtmosphereData> {
    try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=${ATMOSPHERE_MASK}`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": ATMOSPHERE_MASK,
            },
        })
        if (!response.ok) {
            await response.text()
            return emptyAtmosphere()
        }
        const parsed = valibot.parse(googleAtmosphereSchema, await response.json())
        return toAtmosphereData(parsed)
    } catch {
        return emptyAtmosphere()
    }
}

export async function fetchPlaceAtmosphere(
    placeId: string,
    apiKey: string | undefined,
    options: FixtureOptions = {},
): Promise<AtmosphereData> {
    if (placeId === "") {
        return emptyAtmosphere()
    }
    if (options.fixtures === true) {
        return toAtmosphereData(valibot.parse(googleAtmosphereSchema, fixtureAtmosphere))
    }
    if (apiKey === undefined) {
        return emptyAtmosphere()
    }
    return fetchAtmosphereFields(placeId, apiKey)
}
