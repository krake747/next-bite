import { createSignal, createEffect } from "solid-js"
import { createQuery, createMutation } from "./convex-solid"
import { api } from "../../convex/_generated/api"
import type { Doc, Id } from "../../convex/_generated/dataModel"
import { authStore } from "./auth-store"

export const useRestaurants = () => createQuery<Restaurant[]>(api.restaurants.get)
export const useFriends = () => createQuery<Friend[]>(api.friends.get)

export const useAddRestaurant = () => createMutation(api.restaurants.add)
export const useUpdateRestaurant = () => createMutation(api.restaurants.update)
export const useAddFriend = () => createMutation(api.friends.add)

export const useDeleteImage = () => createMutation(api.restaurants.deleteImage)

export interface UploadResult {
    storageId: string
    url: string
}

export function useUploadImage() {
    return async (file: File): Promise<UploadResult> => {
        // Use HTTP action endpoint for more reliable uploads
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
        console.log("Upload successful, storageId:", result.storageId, "url:", result.url)
        return { storageId: result.storageId, url: result.url }
    }
}

export function useStorageUrl(url: () => string | undefined) {
    const [resolvedUrl, setResolvedUrl] = createSignal<string | undefined>(undefined)
    const [isLoading, setIsLoading] = createSignal(false)

    createEffect(() => {
        const directUrl = url()
        if (!directUrl) {
            setResolvedUrl(undefined)
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        // Just use the URL directly - it's already the correct storage URL
        setResolvedUrl(directUrl)
        setIsLoading(false)
    })

    return { url: resolvedUrl, isLoading }
}

export const useAuth = () => authStore

export type Restaurant = Doc<"restaurants">
export type Friend = Doc<"friends">
export type StorageId = Id<"_storage">
