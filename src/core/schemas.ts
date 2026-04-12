import * as v from "valibot"

export const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.pipe(v.string(), v.minLength(1, "Cuisine is required")),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    notes: v.optional(v.string()),
    link: v.optional(v.string()),
    addedBy: v.pipe(v.string(), v.minLength(1, "Must select a friend")),
    rating: v.optional(
        v.pipe(v.number(), v.minValue(0, "Rating must be at least 0"), v.maxValue(6, "Rating must be at most 6")),
    ),
    images: v.optional(v.array(v.string())),
})

export type RestaurantOutput = v.InferOutput<typeof RestaurantSchema>
