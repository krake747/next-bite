import { v } from "convex/values"

export const restaurantImageValidator = v.object({ url: v.string(), storageId: v.string() })
export const openingHoursValidator = v.object({
    openNow: v.boolean(),
    periods: v.array(
        v.object({
            day: v.number(),
            openTime: v.string(),
            closeTime: v.string(),
        }),
    ),
    weekdayText: v.array(v.string()),
})

export const restaurantArgs = {
    name: v.string(),
    cuisine: v.string(),
    location: v.string(),
    addedBy: v.string(),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    notes: v.optional(v.string()),
    link: v.optional(v.string()),
    rating: v.optional(v.number()),
    images: v.optional(v.array(restaurantImageValidator)),
}
