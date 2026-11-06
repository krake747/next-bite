import { useLiveQuery } from "@tanstack/react-db"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { api } from "../../convex/_generated/api"
import { type Doc, type Id } from "../../convex/_generated/dataModel"
import { getConvexSessionToken } from "./auth-client"
import { useAuth } from "./auth-provider"
import { useConvexClient, useConvexQuery, useConvexMutation, useConvexAction } from "./convex-client.tsx"
import {
    applyUpdateArgsToDraft,
    assertRealRestaurantId,
    buildTempRestaurant,
    clearUserScopedQueries,
    getSessionCollections,
    persistCallerFor,
    resolveRestaurantIdByKey,
    type RestaurantAddArgs,
    type RestaurantUpdateArgs,
} from "./db/restaurants"
import { env } from "./env"
import { parseImageRecord, type ImageRecord } from "./schemas"

function useSessionKey(): string | null {
    const { isAuthenticated, isLoading, user } = useAuth()
    // Convex-auth readiness: the better-auth session resolved and names a user. Subscriptions
    // before this point would run unauthenticated against user-scoped queries.
    if (!isAuthenticated || isLoading || user === null) {
        return null
    }
    return user.id
}

function useOwnerOrFeed(kind: "owner" | "feed"): ReadonlyArray<Doc<"restaurants">> | undefined {
    const sessionKey = useSessionKey()
    const client = useConvexClient()
    const queryClient = useQueryClient()
    useEffect(() => {
        // Any session transition, including first mount, drops the previous session's user-scoped
        // query entries. The query cache is client-populated only (no SSR dehydration), so
        // clearing on mount is a no-op for fresh clients.
        clearUserScopedQueries((filters) => {
            queryClient.removeQueries(filters)
        })
    }, [queryClient, sessionKey])
    const gated = sessionKey === null || client === null
    const collections =
        gated || client === null ? null : getSessionCollections(client, persistCallerFor(client), sessionKey)
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
        mutationFn: async (args: RestaurantAddArgs): Promise<Id<"restaurants">> => {
            if (client === null || !auth.isAuthenticated || auth.user === null) {
                throw new Error("Sign in to add restaurants")
            }
            const collections = getSessionCollections(client, persistCallerFor(client), auth.user.id)
            // The persisted key correlates the temp row with its synced server row and makes
            // double-submits idempotent; the backend dedupes retries carrying the same key.
            // A caller-supplied key survives retries, otherwise mint one per attempt.
            const clientMutationId = args.clientMutationId ?? crypto.randomUUID()
            const temp = buildTempRestaurant({
                ownerId: auth.user.id,
                ownerName: auth.user.name ?? "Someone",
                ...args,
                clientMutationId,
            })
            const tx = collections.owner.insert(temp)
            await tx.when("settled").catch(() => {})
            if (tx.state === "failed") {
                throw tx.error?.error ?? new Error("Add failed")
            }
            return resolveRestaurantIdByKey(collections.owner, clientMutationId)
        },
    })
}

export function useUpdateRestaurant() {
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    return useMutation({
        mutationFn: async (args: RestaurantUpdateArgs) => {
            assertRealRestaurantId(args.id)
            if (client === null || sessionKey === null) {
                throw new Error("Sign in to edit restaurants")
            }
            const collections = getSessionCollections(client, persistCallerFor(client), sessionKey)
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

export function useDeleteRestaurant() {
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    return useMutation({
        mutationFn: async (args: { id: Id<"restaurants"> }) => {
            assertRealRestaurantId(args.id)
            if (client === null || sessionKey === null) {
                throw new Error("Sign in to delete restaurants")
            }
            await client.mutation(api.restaurants.remove, args)
        },
    })
}

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
