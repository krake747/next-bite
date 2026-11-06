import { useLiveQuery } from "@tanstack/react-db"
import { useMutation } from "@tanstack/react-query"
import { useEffect } from "react"

import { api } from "../../convex/_generated/api"
import { type Doc, type Id } from "../../convex/_generated/dataModel"
import { getConvexSessionToken } from "./auth-client"
import { useAuth } from "./auth-provider"
import { useConvexClient, useConvexQuery, useConvexMutation, useConvexAction } from "./convex-client.tsx"
import {
    applyUpdateArgsToDraft,
    buildTempRestaurant,
    getRestaurantCollections,
    persistCallerFor,
    type RestaurantAddArgs,
    type RestaurantUpdateArgs,
} from "./db/restaurants"
import { env } from "./env"
import { parseImageRecord, type ImageRecord } from "./schemas"

function useOwnerOrFeed(kind: "owner" | "feed"): ReadonlyArray<Doc<"restaurants">> | undefined {
    const { isAuthenticated } = useAuth()
    const client = useConvexClient()
    const gated = !isAuthenticated || client === null
    const collections = gated || client === null ? null : getRestaurantCollections(client, persistCallerFor(client))
    const collection = collections === null ? null : collections[kind]
    const result = useLiveQuery(() => collection)
    useEffect(() => {
        if (collection !== null) {
            void collection.preload()
        }
    }, [collection])
    if (gated || result.isLoading) {
        return undefined
    }
    return result.data ?? undefined
}

export const useRestaurants = () => useOwnerOrFeed("owner")
export const useFeedRestaurants = () => useOwnerOrFeed("feed")
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

export function useAddRestaurantWithHours() {
    const client = useConvexClient()
    const auth = useAuth()
    return useMutation({
        mutationFn: async (args: RestaurantAddArgs) => {
            if (client === null || !auth.isAuthenticated || auth.user === null) {
                throw new Error("Sign in to add restaurants")
            }
            const collections = getRestaurantCollections(client, persistCallerFor(client))
            const temp = buildTempRestaurant({
                ownerId: auth.user.id,
                ownerName: auth.user.name ?? "Someone",
                ...args,
            })
            const tx = collections.owner.insert(temp)
            await tx.when("settled")
            if (tx.state === "failed") {
                throw tx.error?.error ?? new Error("Add failed")
            }
        },
    })
}

export function useUpdateRestaurant() {
    const client = useConvexClient()
    return useMutation({
        mutationFn: async (args: RestaurantUpdateArgs) => {
            if (client === null) {
                throw new Error("Not connected")
            }
            const collections = getRestaurantCollections(client, persistCallerFor(client))
            const targets = [collections.owner, collections.feed].filter((collection) => collection.has(args.id))
            if (targets.length === 0) {
                await client.mutation(api.restaurants.update, args)
                return
            }
            for (const target of targets) {
                const tx = target.update(args.id, (draft) => {
                    applyUpdateArgsToDraft(draft, args)
                })
                await tx.when("settled")
                if (tx.state === "failed") {
                    throw tx.error?.error ?? new Error("Update failed")
                }
            }
        },
    })
}
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
