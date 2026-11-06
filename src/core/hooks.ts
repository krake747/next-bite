import { api } from "../../convex/_generated/api"
import { type Doc, type Id } from "../../convex/_generated/dataModel"
import { getConvexSessionToken } from "./auth-client"
import { useAuth } from "./auth-provider"
import { useConvexQuery, useConvexMutation, useConvexAction } from "./convex-client.tsx"
import { env } from "./env"
import { parseImageRecord, type ImageRecord } from "./schemas"

export const useRestaurants = () => {
    const { isAuthenticated } = useAuth()
    return useConvexQuery(api.restaurants.get, undefined, { skip: !isAuthenticated })
}
export const useVisibleRestaurant = (id: Id<"restaurants">) => useConvexQuery(api.restaurants.getById, { id })
export const useFriends = () => {
    const { isAuthenticated } = useAuth()
    return useConvexQuery(api.friendships.listFriends, undefined, { skip: !isAuthenticated })
}

export const useLandingStats = () => useConvexQuery(api.landing.getStats)

export type AuthMethods = {
    readonly password: boolean
    readonly google: boolean
    readonly github: boolean
    readonly emailOtp: boolean
}

export const useAuthMethods = (): AuthMethods | undefined => useConvexQuery(api.auth.getAuthMethods)

export const useAddRestaurantWithHours = () => useConvexAction(api.restaurants.addWithOpeningHours)
export const useUpdateRestaurant = () => useConvexMutation(api.restaurants.update)
export const useDeleteRestaurant = () => useConvexMutation(api.restaurants.remove)

export const useDeleteImage = () => useConvexMutation(api.restaurants.deleteImage)
export const useCleanupStorage = () => useConvexMutation(api.restaurants.cleanupStorage)
export const useRefreshOpeningHours = () => useConvexAction(api.restaurants.refreshOpeningHours)
export const useLookupPlaceIdAndHours = () => useConvexAction(api.restaurants.lookupPlaceIdAndHours)

export function useUploadImage() {
    return async (file: Readonly<File>): Promise<ImageRecord> => {
        const token = await getConvexSessionToken()
        if (token === null) {
            throw new Error("Sign in to upload photos")
        }
        const uploadUrl = `${env.VITE_CONVEX_SITE_URL}/upload`

        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type, Authorization: `Bearer ${token}` },
            body: file,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Upload failed: ${response.status} ${errorText}`)
        }

        const result = parseImageRecord(await response.json())
        return { url: result.url, storageId: result.storageId }
    }
}

export { useAuth }
export type { ImageRecord }

export type Restaurant = Doc<"restaurants">
