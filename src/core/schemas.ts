import * as v from "valibot"

import { type Id } from "../../convex/_generated/dataModel"

export const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.pipe(v.string(), v.minLength(1, "Cuisine is required")),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    notes: v.optional(v.string()),
    link: v.optional(v.string()),
    rating: v.optional(
        v.pipe(v.number(), v.minValue(1, "Rating must be at least 1"), v.maxValue(7, "Rating must be at most 7")),
    ),
    images: v.optional(v.array(v.string())),
    placeId: v.optional(v.string()),
})

export type RestaurantOutput = v.InferOutput<typeof RestaurantSchema>

const imageRecordSchema = v.object({
    url: v.pipe(v.string(), v.minLength(1)),
    // The upload endpoint returns the storage id as a JSON string. Brand it here at the parse
    // boundary; the backend revalidates the table on every call, so this proves plumbing only.
    storageId: v.custom<Id<"_storage">>((value) => typeof value === "string" && value.length > 0),
    ownerId: v.optional(v.string()),
    displayName: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    byteSize: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
})

export type ImageRecord = v.InferOutput<typeof imageRecordSchema>

export function parseImageRecord(value: unknown): ImageRecord {
    return v.parse(imageRecordSchema, value)
}
