import { useLiveQuery } from "@tanstack/react-db"
import { mutationOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { type ConvexReactClient } from "convex/react"
import { useEffect, useRef, useState } from "react"

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
    preloadReadySessionCollections,
    publishReadySession,
    resolveRestaurantIdByKey,
    type RestaurantAddArgs,
    type RestaurantUpdateArgs,
} from "@api/db/restaurants"
import { api } from "@api/endpoints"

import { FALLBACK_DISPLAY_NAME } from "./constants"
import { env } from "./env"
import { parseImageRecord, type ImageRecord } from "./schemas"
import { gateId, retrySessionGate, useAuth, useSessionKey, useSessionStatus } from "./session"

export class CollectionSyncError extends Error {
    constructor() {
        super("Your restaurants could not sync")
        this.name = "CollectionSyncError"
    }
}

function useSessionSyncRecovery(
    input: Readonly<{
        syncFailed: boolean
        source: object | null
        sessionKey: string | null
        client: ConvexReactClient | null
        recovered: boolean
    }>,
): boolean {
    const { syncFailed, source, sessionKey, client, recovered } = input
    const failedRef = useRef(false)
    const [exhausted, setExhausted] = useState(false)
    useEffect(() => {
        if (syncFailed && !failedRef.current && sessionKey !== null && client !== null) {
            failedRef.current = true
            dropSessionCollections(client, sessionKey)
            retrySessionGate()
        } else if (syncFailed && failedRef.current) {
            setExhausted(true)
        } else if (recovered) {
            failedRef.current = false
            setExhausted(false)
        }
    }, [syncFailed, source, sessionKey, client, recovered])
    return exhausted
}

type Rows = ReadonlyArray<Doc<"restaurants">>
type SettledRows = { readonly sessionKey: string; readonly rows: Rows }
type LiveRead = Readonly<{ status: string; isLoadingError: boolean; isSyncError: boolean }>

function didSyncFail(read: LiveRead): boolean {
    return read.isLoadingError || read.isSyncError || read.status === "error" || read.status === "crashed"
}

function keptRowsFor(kept: SettledRows | null, sessionKey: string): Rows | undefined {
    return kept !== null && kept.sessionKey === sessionKey && kept.rows.length > 0 ? kept.rows : undefined
}

function keptOrThrow(kept: Rows | undefined, failed: boolean): Rows | undefined {
    if (kept === undefined && failed) {
        throw new CollectionSyncError()
    }
    return kept
}

function useSessionCollection(kind: "owner" | "feed", sessionKey: string | null, client: ConvexReactClient | null) {
    "use no memo"
    const queryClient = useQueryClient()
    useEffect(() => {
        claimSessionCache(
            (filters) => {
                queryClient.removeQueries(filters)
            },
            queryClient,
            sessionKey,
        )
    }, [queryClient, sessionKey])
    const collection =
        sessionKey === null || client === null
            ? null
            : getSessionCollections(client, persistCallerFor(client), sessionKey)[kind]
    useEffect(() => {
        if (collection !== null) {
            void collection.preload()
        }
    }, [collection])
    return collection
}

function useOwnerOrFeed(kind: "owner" | "feed"): Rows | undefined {
    "use no memo"
    const sessionKey = useSessionKey()
    const client = useConvexClient()
    const collection = useSessionCollection(kind, sessionKey, client)
    const result = useLiveQuery(() => collection)
    const syncFailed = collection !== null && didSyncFail(result)
    const rows: Rows | undefined = result.data
    const ready = collection !== null && !syncFailed && result.status === "ready"
    const exhausted = useSessionSyncRecovery({ syncFailed, source: collection, sessionKey, client, recovered: ready })
    const settledRef = useRef<SettledRows | null>(null)
    if (sessionKey === null || collection === null) {
        return undefined
    }
    if (ready && rows !== undefined) {
        settledRef.current = { sessionKey, rows }
        return rows
    }
    return keptOrThrow(keptRowsFor(settledRef.current, sessionKey), syncFailed && exhausted)
}

export function usePublishReadySession(): void {
    const sessionKey = useSessionKey()
    const client = useConvexClient()
    const queryClient = useQueryClient()
    useEffect(() => {
        publishReadySession(queryClient, sessionKey === null || client === null ? null : { client, sessionKey })
        return () => {
            publishReadySession(queryClient, null)
        }
    }, [queryClient, client, sessionKey])
}

export function preloadHomeCollections(queryClient: QueryClient): void {
    preloadReadySessionCollections(queryClient)
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
    const auth = useAuth()
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
