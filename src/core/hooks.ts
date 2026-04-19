import { createQuery, createMutation, createAction } from "./convex-solid"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { authStore } from "./auth-store"

export const useRestaurants = () => createQuery<Restaurant[]>(api.restaurants.get)
export const useFriends = () => createQuery<Friend[]>(api.friends.get)

export const useAddRestaurant = () => createMutation(api.restaurants.add)
export const useAddRestaurantWithHours = () => createAction(api.restaurants.addWithOpeningHours)
export const useUpdateRestaurant = () => createMutation(api.restaurants.update)

export const useDeleteImage = () => createMutation(api.restaurants.deleteImage)
export const useCleanupStorage = () => createMutation(api.restaurants.cleanupStorage)
export const useRefreshOpeningHours = () => createAction(api.restaurants.refreshOpeningHours)
export const useLookupPlaceIdAndHours = () => createAction(api.restaurants.lookupPlaceIdAndHours)

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

export const useAuth = () => authStore

export type Restaurant = Doc<"restaurants">
export type Friend = Doc<"friends">
export type StorageId = Id<"_storage">
