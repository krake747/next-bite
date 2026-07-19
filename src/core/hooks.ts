import { useConvexQuery, useConvexMutation, useConvexAction } from "./convex-solid.tsx"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { useAuth } from "./auth-provider"

export const useRestaurants = () => useConvexQuery<Restaurant[]>(api.restaurants.get)
export const useFriends = () => useConvexQuery<Friend[]>(api.friends.get)

export const useAddRestaurant = () => useConvexMutation(api.restaurants.add)
export const useAddRestaurantWithHours = () => useConvexAction(api.restaurants.addWithOpeningHours)
export const useUpdateRestaurant = () => useConvexMutation(api.restaurants.update)
export const useDeleteRestaurant = () => useConvexMutation(api.restaurants.remove)

export const useDeleteImage = () => useConvexMutation(api.restaurants.deleteImage)
export const useCleanupStorage = () => useConvexMutation(api.restaurants.cleanupStorage)
export const useRefreshOpeningHours = () => useConvexAction(api.restaurants.refreshOpeningHours)
export const useLookupPlaceIdAndHours = () => useConvexAction(api.restaurants.lookupPlaceIdAndHours)

export type ImageRecord = {
    url: string
    storageId: string
}

export type OpeningHours = {
    openNow: boolean
    periods: Array<{
        day: number
        openTime: string
        closeTime: string
    }>
    weekdayText: string[]
}

export function useUploadImage() {
    return async (file: File): Promise<ImageRecord> => {
        const siteUrl = import.meta.env.VITE_CONVEX_SITE_URL
        if (!siteUrl) {
            throw new Error("VITE_CONVEX_SITE_URL is not defined")
        }

        const uploadUrl = `${siteUrl}/upload`

        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Upload failed: ${response.status} ${errorText}`)
        }

        const result = (await response.json()) as ImageRecord
        return { url: result.url, storageId: result.storageId }
    }
}

export { useAuth }

export type Restaurant = Doc<"restaurants">
export type Friend = Doc<"friends">
export type StorageId = Id<"_storage">
