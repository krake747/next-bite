import { useLiveQuery } from "@tanstack/react-db"
import { mutationOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { type ConvexReactClient } from "convex/react"
import { useEffect, useRef } from "react"

import { useAuth as useAuthSource } from "@api/auth.provider"
import { getConvexSessionToken } from "@api/auth.sdk"
import { useConvexClient, useConvexQuery, useConvexMutation, useConvexAction } from "@api/convex.context"
import { type Doc, type Id } from "@api/data.model"
import {
    applyUpdateArgsToDraft,
    assertRealRestaurantId,
    buildTempRestaurant,
    claimSessionCache,
    dropSessionCollections,
    getSessionCollections,
    persistCallerFor,
    resolveRestaurantIdByKey,
    type RestaurantAddArgs,
    type RestaurantUpdateArgs,
} from "@api/db/restaurants"
import { api } from "@api/endpoints"

import { FALLBACK_DISPLAY_NAME } from "./constants"
import { env } from "./env"
import { parseImageRecord, type ImageRecord } from "./schemas"
import { gateId, retrySessionGate, useSessionKey, useSessionStatus } from "./session"

function useSessionSyncRecovery(
    input: Readonly<{
        gated: boolean
        sessionKey: string | null
        client: ConvexReactClient | null
        isLoadingError: boolean
        isSyncError: boolean
        status: string
        hasData: boolean
    }>,
): void {
    const { gated, sessionKey, client, isLoadingError, isSyncError, status, hasData } = input
    const syncFailed = !gated && (isLoadingError || isSyncError || status === "error" || status === "crashed")
    const failedRef = useRef(false)
    useEffect(() => {
        // A failed sync poisons the cached collections (typically an expired
        // Convex token mid-session). Evict the session cache so the next read
        // subscribes fresh, and re-verify auth: success restores the same
        // user's live data, failure surfaces the timeout notice with a retry.
        // Edge-triggered per failure episode; the latch only clears once the
        // collection serves data again, so a still-broken backend cannot loop.
        if (syncFailed && !failedRef.current && sessionKey !== null && client !== null) {
            failedRef.current = true
            dropSessionCollections(client, sessionKey)
            retrySessionGate()
        } else if (!syncFailed && hasData) {
            failedRef.current = false
        }
    }, [syncFailed, sessionKey, client, hasData, gated])
}

function useOwnerOrFeed(kind: "owner" | "feed"): ReadonlyArray<Doc<"restaurants">> | undefined {
    const sessionKey = useSessionKey()
    const client = useConvexClient()
    const queryClient = useQueryClient()
    useEffect(() => {
        // Evict only when a ready session takes over a cache owned by another session. Skips
        // probing mounts and owner matches, so components that mount on loaded data keep it.
        claimSessionCache(
            (filters) => {
                queryClient.removeQueries(filters)
            },
            queryClient,
            sessionKey,
        )
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
    useSessionSyncRecovery({
        gated,
        sessionKey,
        client,
        isLoadingError: result.isLoadingError,
        isSyncError: result.isSyncError,
        status: result.status,
        hasData: result.data !== undefined,
    })
    if (gated || result.isLoading) {
        return undefined
    }
    return result.data
}

export const useRestaurants = () => useOwnerOrFeed("owner")
export const useFeedRestaurants = () => useOwnerOrFeed("feed")

export const useVisitMemories = (restaurantId: Id<"restaurants"> | undefined) => {
    const status = useSessionStatus()
    const gated = gateId(status, restaurantId)
    return useConvexQuery(api.restaurants.listVisitMemories, gated.skip ? undefined : { restaurantId: gated.id }, {
        skip: gated.skip,
    })
}

export const useAddVisitMemory = () => useConvexMutation(api.restaurants.addVisitMemory)

export function useAddRestaurantWithHours() {
    const client = useConvexClient()
    const auth = useAuthSource()
    return useMutation(
        mutationOptions({
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
                    ownerName: auth.user.name ?? FALLBACK_DISPLAY_NAME,
                    ...args,
                    clientMutationId,
                })
                const tx = collections.owner.insert(temp)
                // The rejection surfaces via tx.state below; swallowing here avoids an
                // unhandled rejection while the definitive error is thrown next.
                await tx.when("settled").catch(() => {})
                if (tx.state === "failed") {
                    throw tx.error?.error ?? new Error("Add failed")
                }
                return resolveRestaurantIdByKey(collections.owner, clientMutationId)
            },
        }),
    )
}

export function useUpdateRestaurant() {
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    return useMutation(
        mutationOptions({
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
        }),
    )
}

export function useDeleteRestaurant() {
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    return useMutation(
        mutationOptions({
            mutationFn: async (args: { id: Id<"restaurants"> }) => {
                assertRealRestaurantId(args.id)
                if (client === null || sessionKey === null) {
                    throw new Error("Sign in to delete restaurants")
                }
                await client.mutation(api.restaurants.remove, args)
            },
        }),
    )
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

export type { ImageRecord } from "./schemas"

export type Restaurant = Doc<"restaurants">
