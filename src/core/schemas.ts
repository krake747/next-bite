import * as v from "valibot"

export const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.pipe(v.string(), v.minLength(1, "Cuisine is required")),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    notes: v.optional(v.string()),
    link: v.optional(v.string()),
    rating: v.optional(
        v.pipe(v.number(), v.minValue(1, "Rating must be at least 1"), v.maxValue(6, "Rating must be at most 6")),
    ),
    images: v.optional(v.array(v.string())),
    placeId: v.optional(v.string()),
})

export type RestaurantOutput = v.InferOutput<typeof RestaurantSchema>

const imageRecordSchema = v.object({
    url: v.pipe(v.string(), v.minLength(1)),
    storageId: v.pipe(v.string(), v.minLength(1)),
})

export type ImageRecord = v.InferOutput<typeof imageRecordSchema>

export function parseImageRecord(value: unknown): ImageRecord {
    return v.parse(imageRecordSchema, value)
}
