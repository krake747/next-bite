import * as v from "valibot"

import { type Id } from "../../convex/_generated/dataModel"

export const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.optional(v.string()),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    notes: v.optional(v.string()),
    link: v.optional(v.string()),
    placeId: v.optional(v.string()),
})

export type RestaurantOutput = v.InferOutput<typeof RestaurantSchema>

const imageRecordSchema = v.object({
    url: v.pipe(v.string(), v.minLength(1)),
    storageId: v.custom<Id<"_storage">>((value) => typeof value === "string" && value.length > 0),
    ownerId: v.optional(v.string()),
    mimeType: v.optional(v.string()),
    byteSize: v.optional(v.number()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
})

export type ImageRecord = v.InferOutput<typeof imageRecordSchema>

const uploadResultSchema = v.object({
    storageId: v.custom<Id<"_storage">>((value) => typeof value === "string" && value.length > 0),
})

export function parseUploadResult(value: unknown): v.InferOutput<typeof uploadResultSchema> {
    return v.parse(uploadResultSchema, value)
}
