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
