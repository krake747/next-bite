import { useLiveQuery } from "@tanstack/react-db"
import { mutationOptions, useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { type ConvexReactClient } from "convex/react"
import { useEffect, useRef, useState } from "react"

import { useConvexAction, useConvexClient, useConvexMutation } from "@api/convex.context"
import { convexQueryOptions } from "@api/convex.options"
import { type Doc, type Id } from "@api/data.model"
import {
    buildTempRestaurant,
    claimSessionCache,
    dropSessionCollections,
    getSessionCollections,
    persistCallerFor,
    preloadReadySessionCollections,
    publishReadySession,
    resolveRestaurantIdByKey,
    type Restaurant,
    type RestaurantCreateArgs,
} from "@api/db/restaurants"
import { api } from "@api/endpoints"

import { useViewerProfile } from "./identity"
import { parseUploadResult, type ImageRecord } from "./schemas"
import { retrySessionGate, useSessionKey } from "./session"

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
            failedRef.current = false
        } else if (recovered) {
            failedRef.current = false
            setExhausted(false)
        }
    }, [syncFailed, source, sessionKey, client, recovered])
    return exhausted
}

type Rows = ReadonlyArray<Restaurant>
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
    // No preload effect: the useLiveQuery subscription below starts syncing on mount.
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
    }, [sessionKey, client, queryClient])
}

export function preloadHomeCollections(queryClient: QueryClient): void {
    preloadReadySessionCollections(queryClient)
}

export const useRestaurants = () => useOwnerOrFeed("owner")
export const useFeedRestaurants = () => useOwnerOrFeed("feed")

export function restaurantOptions(id: Id<"places">) {
    return convexQueryOptions(api.places.get, { id })
}

export function restaurantDetailWarmups(id: Id<"places">): ReadonlyArray<object> {
    return [restaurantOptions(id)]
}

export const useGooglePlaceLocation = () => useConvexAction(api.places.location).mutateAsync

export const useGooglePlaceDetails = () => useConvexAction(api.places.details).mutateAsync

async function resolveOwnerProfile(
    client: ConvexReactClient,
    cached: Doc<"profiles"> | undefined,
): Promise<Doc<"profiles"> | undefined> {
    if (cached !== undefined) {
        return cached
    }
    const me = await client.query(api.identity.me, {})
    return me.status === "ready" ? me.profile : undefined
}

type RestaurantPreview = {
    readonly storageId: Id<"_storage">
    readonly url: string
    readonly width?: number | undefined
    readonly height?: number | undefined
}

export function useAddRestaurant() {
    const client = useConvexClient()
    const sessionKey = useSessionKey()
    const profile = useViewerProfile()
    return useMutation(
        mutationOptions({
            mutationFn: async (
                args: RestaurantCreateArgs & { readonly previews: ReadonlyArray<RestaurantPreview> },
            ) => {
                if (client === null || sessionKey === null) {
                    throw new Error("Sign in to add restaurants")
                }
                const owner = await resolveOwnerProfile(client, profile)
                if (owner === undefined) {
                    throw new Error("Sign in to add restaurants")
                }
                const collections = getSessionCollections(client, persistCallerFor(client), sessionKey)
                // See ADR-0002: persisted key makes retries idempotent.
                const clientMutationId = args.clientMutationId ?? crypto.randomUUID()
                const previewUrls = new Map(args.previews.map((preview) => [String(preview.storageId), preview.url]))
                const temp = buildTempRestaurant({
                    ownerId: owner._id,
                    ownerName: owner.name,
                    ...args,
                    clientMutationId,
                    previewUrls,
                })
                const tx = collections.owner.insert(temp)
                // Swallowed here; the definitive error is thrown next.
                await tx.when("settled").catch(() => {})
                if (tx.state === "failed") {
                    throw tx.error?.error ?? new Error("Add failed")
                }
                return resolveRestaurantIdByKey(collections.owner, clientMutationId)
            },
        }),
    )
}

export function useUploadImage() {
    const client = useConvexClient()
    return async (file: Readonly<File>): Promise<ImageRecord> => {
        if (client === null) {
            throw new Error("Sign in to upload photos")
        }
        const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {})
        const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
        })
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} ${await response.text()}`)
        }
        const { storageId } = parseUploadResult(await response.json())
        return { url: URL.createObjectURL(file), storageId }
    }
}

export const useDeleteUpload = () => useConvexMutation(api.storage.deleteUpload)

export const useAddRestaurantPhotos = () => useConvexMutation(api.places.addPhotos)

export const useRemoveRestaurantPhoto = () => useConvexMutation(api.places.removePhoto)

export type { Restaurant } from "@api/db/restaurants"
