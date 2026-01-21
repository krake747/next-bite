import * as v from "valibot"

export const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.pipe(v.string(), v.minLength(1, "Cuisine is required")),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    notes: v.optional(v.string()),
    link: v.optional(v.string()),
    addedBy: v.pipe(v.string(), v.minLength(1, "Must select a friend")),
    rating: v.optional(
        v.pipe(
            v.union([v.string(), v.number()]),
            v.transform((val) => (typeof val === "string" ? parseFloat(val) || 0 : val)),
            v.number(),
            v.minValue(0, "Rating must be at least 0"),
            v.maxValue(5, "Rating must be at most 5")
        )
    ),
})

export type RestaurantOutput = v.InferOutput<typeof RestaurantSchema>
