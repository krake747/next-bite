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
})

async function fetchCurrentLocation(placeId: string, apiKey: string): Promise<PlaceLocationData | null> {
    try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location`, {
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "location",
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
        return { lat: latitude, lng: longitude }
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
