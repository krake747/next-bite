import { convexCollectionOptions } from "@tanstack/convex-db-collection"
import { createCollection } from "@tanstack/db"
import { type ConvexReactClient } from "convex/react"

import { type Doc, type Id, toId } from "@api/data.model"
import { api } from "@api/endpoints"
import { sleep } from "@core/async"
import { assertRealId, isTempId, TEMP_ID_PREFIX } from "@core/temp.ids"

const SYNC_RESOLVE_POLL_MS = 50

export type PlacePhoto = {
    readonly url: string
    readonly width?: number
    readonly height?: number
    readonly storageId: Id<"_storage">
}

export type SaveStatus = "want" | "been"

export type PlaceCard = Doc<"places"> & {
    readonly ownerName: string
    readonly photos: ReadonlyArray<PlacePhoto>
    readonly mySave: SaveStatus | null
    readonly wantCount: number | string
}

export type SyncClient = Pick<ConvexReactClient, "watchQuery">

export type PlacePhotoInput = {
    readonly storageId: Id<"_storage">
    readonly width?: number
    readonly height?: number
}

export type PlaceGoogleInput = {
    readonly placeId?: string
    readonly lat?: number
    readonly lng?: number
}

export type PlaceCreateArgs = {
    readonly name: string
    readonly cuisine?: string
    readonly addressLabel: string
    readonly google?: PlaceGoogleInput
    readonly note?: string
    readonly link?: string
    readonly photos: PlacePhotoInput[]
    readonly clientMutationId?: string
}

export type RestaurantPersist = {
    readonly addPlace: (args: PlaceCreateArgs) => Promise<Id<"places">>
}

export function persistCallerFor(client: ConvexReactClient): RestaurantPersist {
    return {
        addPlace: async (args) => client.mutation(api.places.create, args),
    }
}

function toPhotoInput(photo: PlacePhoto): PlacePhotoInput {
    const input: { storageId: Id<"_storage">; width?: number; height?: number } = {
        storageId: photo.storageId,
    }
    if (photo.width !== undefined) {
        input.width = photo.width
    }
    if (photo.height !== undefined) {
        input.height = photo.height
    }
    return input
}

function tempPhoto(
    photo: PlacePhotoInput,
    previewUrls: ReadonlyMap<string, string>,
): PlacePhotoInput & { readonly url: string } {
    const out: { storageId: Id<"_storage">; url: string; width?: number; height?: number } = {
        storageId: photo.storageId,
        url: previewUrls.get(String(photo.storageId)) ?? "",
    }
    if (photo.width !== undefined) {
        out.width = photo.width
    }
    if (photo.height !== undefined) {
        out.height = photo.height
    }
    return out
}

export function toCreateArgs(row: PlaceCard): PlaceCreateArgs {
    return {
        name: row.name,
        ...(row.cuisine !== undefined ? { cuisine: row.cuisine } : {}),
        addressLabel: row.address.label,
        ...(row.address.google !== undefined ? { google: { ...row.address.google } } : {}),
        ...(row.note !== undefined ? { note: row.note } : {}),
        ...(row.link !== undefined ? { link: row.link } : {}),
        photos: row.photos.map((photo) => toPhotoInput(photo)),
        ...(row.clientMutationId !== undefined ? { clientMutationId: row.clientMutationId } : {}),
    }
}

export type TempPlaceInput = PlaceCreateArgs &
    Readonly<{
        ownerId: Id<"profiles">
        ownerName: string
        clientMutationId: string
        previewUrls: ReadonlyMap<string, string>
    }>

export function buildTempPlace(input: TempPlaceInput): PlaceCard {
    const now = Date.now()
    const tempId = toId<"places">(`${TEMP_ID_PREFIX}${crypto.randomUUID()}`)
    return {
        _id: tempId,
        _creationTime: now,
        ownerId: input.ownerId,
        ownerName: input.ownerName,
        name: input.name,
        ...(input.cuisine !== undefined ? { cuisine: input.cuisine } : {}),
        address: {
            label: input.addressLabel,
            ...(input.google !== undefined
                ? {
                      google: {
                          ...(input.google.placeId !== undefined ? { placeId: input.google.placeId } : {}),
                          ...(input.google.lat !== undefined ? { lat: input.google.lat } : {}),
                          ...(input.google.lng !== undefined ? { lng: input.google.lng } : {}),
                      },
                  }
                : {}),
        },
        ...(input.note !== undefined ? { note: input.note } : {}),
        ...(input.link !== undefined ? { link: input.link } : {}),
        photos: input.photos.map((photo) => tempPhoto(photo, input.previewUrls)),
        mySave: null,
        wantCount: 0,
        clientMutationId: input.clientMutationId,
    }
}

export type SyncedRows = {
    values(): Iterable<PlaceCard>
}

// See ADR-0002: timeout is not failure; retry on the same key.
export class SyncTimeoutError extends Error {
    readonly code = "SYNC_TIMEOUT" as const

    constructor(message = "Timed out waiting for the synced place") {
        super(message)
        this.name = "SyncTimeoutError"
    }

    static is(error: unknown): error is SyncTimeoutError {
        return error instanceof SyncTimeoutError && error.code === "SYNC_TIMEOUT"
    }
}

// See ADR-0002: resolve synced row by key, skip temp row.
export async function resolvePlaceIdByKey(
    rows: SyncedRows,
    clientMutationId: string,
    timeoutMs = 15000,
): Promise<Id<"places">> {
    const startedAt = Date.now()
    for (;;) {
        for (const row of rows.values()) {
            if (row.clientMutationId === clientMutationId && !isTempId(String(row._id))) {
                return row._id
            }
        }
        if (Date.now() - startedAt >= timeoutMs) {
            throw new SyncTimeoutError()
        }
        await sleep(SYNC_RESOLVE_POLL_MS)
    }
}

function createPlaceCollections(syncClient: SyncClient, persist: RestaurantPersist) {
    const shared = {
        client: syncClient,
        getKey: (item: PlaceCard) => item._id,
        onInsert: async ({ transaction }: { transaction: { mutations: { modified: PlaceCard }[] } }) => {
            for (const mutation of transaction.mutations) {
                await persist.addPlace(toCreateArgs(mutation.modified))
            }
        },
        onUpdate: async (): Promise<void> => {
            await Promise.resolve()
            throw new Error("Places cannot be edited")
        },
    }
    return {
        owner: createCollection(convexCollectionOptions({ ...shared, query: api.places.mine, queryArgs: {} })),
        feed: createCollection(convexCollectionOptions({ ...shared, query: api.places.feed, queryArgs: {} })),
    }
}

const collectionCache = new WeakMap<
    object,
    { sessionKey: string; collections: ReturnType<typeof createPlaceCollections> }
>()

// See ADR-0002: collections scoped per session, no cross-session leaks.
export function getSessionCollections(
    syncClient: SyncClient,
    persist: RestaurantPersist,
    sessionKey: string,
): ReturnType<typeof createPlaceCollections> {
    const hit = collectionCache.get(syncClient)
    if (hit !== undefined && hit.sessionKey === sessionKey) {
        return hit.collections
    }
    const created = createPlaceCollections(syncClient, persist)
    collectionCache.set(syncClient, { sessionKey, collections: created })
    return created
}

// See ADR-0002: evict only own session to recover poisoned sync.
export function dropSessionCollections(syncClient: SyncClient, sessionKey: string): boolean {
    const hit = collectionCache.get(syncClient)
    if (hit === undefined || hit.sessionKey !== sessionKey) {
        return false
    }
    collectionCache.delete(syncClient)
    return true
}

type ReadySession = Readonly<{ client: ConvexReactClient; sessionKey: string }>

const readySessions = new WeakMap<object, ReadySession>()

export function publishReadySession(owner: object, session: ReadySession | null): void {
    if (session === null) {
        readySessions.delete(owner)
        return
    }
    readySessions.set(owner, session)
}

export function preloadReadySessionCollections(owner: object): void {
    const session = readySessions.get(owner)
    if (session === undefined) {
        return
    }
    const collections = getSessionCollections(session.client, persistCallerFor(session.client), session.sessionKey)
    void collections.owner.preload()
    void collections.feed.preload()
}

const USER_SCOPED_QUERY_PREFIXES = ["places:", "identity:", "social:", "groups:", "plans:", "invites:"]

function isUserScopedQueryKey(queryKey: ReadonlyArray<unknown>): boolean {
    const fn = queryKey[0] === "convexQuery" ? queryKey[1] : undefined
    return typeof fn === "string" && USER_SCOPED_QUERY_PREFIXES.some((prefix) => fn.startsWith(prefix))
}

export function clearUserScopedQueries(
    removeQueries: (filters: { predicate: (query: { queryKey: ReadonlyArray<unknown> }) => boolean }) => void,
): void {
    removeQueries({ predicate: (query) => isUserScopedQueryKey(query.queryKey) })
}

// See ADR-0002: shared cache evicts only on owner change to avoid remount loops.
const sessionCacheOwners = new WeakMap<object, string>()

export function claimSessionCache(
    removeQueries: (filters: { predicate: (query: { queryKey: ReadonlyArray<unknown> }) => boolean }) => void,
    queryClient: object,
    sessionKey: string | null,
): void {
    if (sessionKey === null) {
        return
    }
    const owner = sessionCacheOwners.get(queryClient)
    if (owner === sessionKey) {
        return
    }
    if (owner !== undefined) {
        clearUserScopedQueries(removeQueries)
    }
    sessionCacheOwners.set(queryClient, sessionKey)
}

// See ADR-0002: temp ids never travel; collections resolve by key.
export function assertRealPlaceId(id: Id<"places">): void {
    assertRealId(String(id))
}
