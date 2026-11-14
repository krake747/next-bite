import { type Infer } from "convex/values"
import * as valibot from "valibot"

import { placeLocationValidator } from "../../validators"

export type PlaceLocationData = Infer<typeof placeLocationValidator>

const googleLocationSchema = valibot.object({
    location: valibot.optional(
        valibot.object({
            latitude: valibot.optional(valibot.number()),
            longitude: valibot.optional(valibot.number()),
        }),
    ),
    viewport: valibot.optional(
        valibot.object({
            low: valibot.optional(
                valibot.object({
                    latitude: valibot.optional(valibot.number()),
                    longitude: valibot.optional(valibot.number()),
                }),
            ),
            high: valibot.optional(
                valibot.object({
                    latitude: valibot.optional(valibot.number()),
                    longitude: valibot.optional(valibot.number()),
                }),
            ),
        }),
    ),
})

type GoogleViewport = {
    readonly low: { readonly lat: number; readonly lng: number }
    readonly high: { readonly lat: number; readonly lng: number }
}

function toViewport(
    viewport: valibot.InferOutput<typeof googleLocationSchema>["viewport"],
): GoogleViewport | undefined {
    const lowLat = viewport?.low?.latitude
    const lowLng = viewport?.low?.longitude
    const highLat = viewport?.high?.latitude
    const highLng = viewport?.high?.longitude
    if (lowLat === undefined || lowLng === undefined || highLat === undefined || highLng === undefined) {
        return undefined
    }
    return {
        low: { lat: lowLat, lng: lowLng },
        high: { lat: highLat, lng: highLng },
    }
}

async function fetchCurrentLocation(placeId: string, apiKey: string): Promise<PlaceLocationData | null> {
    try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location,viewport`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "location,viewport",
            },
        })

        if (!response.ok) {
            await response.text()
            return null
        }

        const data = valibot.parse(googleLocationSchema, await response.json())
        const latitude = data.location?.latitude
        const longitude = data.location?.longitude
        if (latitude === undefined || longitude === undefined) {
            return null
        }
        const viewport = toViewport(data.viewport)
        return viewport === undefined ? { lat: latitude, lng: longitude } : { lat: latitude, lng: longitude, viewport }
    } catch {
        return null
    }
}

export async function fetchPlaceLocation(
    placeId: string,
    apiKey: string | undefined,
): Promise<PlaceLocationData | null> {
    if (placeId === "" || apiKey === undefined) {
        return null
    }
    return fetchCurrentLocation(placeId, apiKey)
}
