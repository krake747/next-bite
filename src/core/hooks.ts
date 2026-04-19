import { createQuery, createMutation } from "./convex-solid"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { authStore } from "./auth-store"

export const useRestaurants = () => createQuery<Restaurant[]>(api.restaurants.get)
export const useFriends = () => createQuery<Friend[]>(api.friends.get)

export const useAddRestaurant = () => createMutation(api.restaurants.add)
export const useUpdateRestaurant = () => createMutation(api.restaurants.update)

export const useDeleteImage = () => createMutation(api.restaurants.deleteImage)

export type ImageRecord = {
    url: string
    storageId: string
}

type UploadResult = {
    storageId: string
    url: string
}

export function useUploadImage() {
    return async (file: File): Promise<UploadResult> => {
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

        const result = (await response.json()) as { storageId: string; url: string }
        return { storageId: result.storageId, url: result.url }
    }
}

export const useAuth = () => authStore

export type Restaurant = Doc<"restaurants">
export type Friend = Doc<"friends">
export type StorageId = Id<"_storage">
