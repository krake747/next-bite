import * as v from "valibot"

export const RestaurantSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Name is required")),
    cuisine: v.pipe(v.string(), v.minLength(1, "Cuisine is required")),
    location: v.pipe(v.string(), v.minLength(1, "Location is required")),
    notes: v.optional(v.string()),
    link: v.optional(v.string()),
    addedBy: v.pipe(v.string(), v.minLength(1, "Must select a friend")),
})

export type RestaurantOutput = v.InferOutput<typeof RestaurantSchema>