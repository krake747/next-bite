import { convexCollectionOptions } from "@tanstack/convex-db-collection"
import { createCollection } from "@tanstack/db"
import { type ConvexReactClient } from "convex/react"

import { type Doc, type Id, toId } from "@api/data.model"
import { api } from "@api/endpoints"
import { sleep } from "@core/async"
import { mergeDetails, mergeEnrichment } from "@core/restaurant.details"
import { assertRealId, isTempId, TEMP_ID_PREFIX } from "@core/temp.ids"

const SYNC_RESOLVE_POLL_MS = 50

export type RestaurantDoc = Doc<"restaurants">

export type SyncClient = Pick<ConvexReactClient, "watchQuery">

export type RestaurantCoords = {
    readonly lat: number
    readonly lng: number
}

export type RestaurantImageInput = {
    readonly url: string
    readonly storageId: Id<"_storage">
}

export type RestaurantUpdateArgs = {
    readonly id: Id<"restaurants">
    readonly name?: string
    readonly cuisine?: string
    readonly addressLabel?: string
    readonly coords?: RestaurantCoords
    readonly notes?: string
    readonly link?: string
    readonly rating?: number
    readonly images?: RestaurantImageInput[]
    readonly visibility?: "private" | "shared"
}

export type RestaurantAddArgs = {
    readonly name: string
    readonly cuisine: string
    readonly addressLabel: string
    readonly notes?: string
    readonly link?: string
    readonly coords?: RestaurantCoords
    readonly placeId?: string
    readonly images?: RestaurantImageInput[]
    readonly clientMutationId?: string
}

export type RestaurantPersist = {
    readonly updateRestaurant: (args: RestaurantUpdateArgs) => Promise<unknown>
    readonly addRestaurant: (args: RestaurantAddArgs) => Promise<Id<"restaurants">>
}

function copyStoredImages(
    images: ReadonlyArray<Readonly<{ url: string; storageId: Id<"_storage"> }>>,
): RestaurantImageInput[] {
    return images.map((img) => ({ url: img.url, storageId: img.storageId }))
}

function coordsArg(coords: RestaurantCoords | undefined): { coords: RestaurantCoords } | Record<string, never> {
    if (coords === undefined) {
        return {}
    }
    return { coords: { lat: coords.lat, lng: coords.lng } }
}

export function persistCallerFor(client: ConvexReactClient): RestaurantPersist {
    return {
        updateRestaurant: async (args) => {
            await client.mutation(api.restaurants.update, args)
        },
        addRestaurant: async (args) => client.action(api.restaurants.addWithOpeningHours, args),
    }
}

export function applyUpdateArgsToDraft(draft: RestaurantDoc, args: RestaurantUpdateArgs): void {
    if (args.name !== undefined) {
        draft.name = args.name
    }
    if (args.cuisine !== undefined) {
        draft.cuisine = args.cuisine
    }
    if (args.addressLabel !== undefined || args.coords !== undefined) {
        const enrichment = mergeEnrichment(draft.address.enrichment, args.coords)
        draft.address = {
            label: args.addressLabel ?? draft.address.label,
            ...(enrichment !== undefined ? { enrichment } : {}),
        }
    }
    if (args.notes !== undefined || args.link !== undefined) {
        const details = mergeDetails(draft.details, { notes: args.notes, link: args.link })
        if (details !== undefined) {
            draft.details = details
        }
    }
    if (args.rating !== undefined) {
        draft.rating = args.rating
    }
    if (args.images !== undefined) {
        draft.images = copyStoredImages(args.images)
    }
    if (args.visibility !== undefined) {
        draft.visibility = args.visibility
    }
}

export function toUpdateArgs(row: RestaurantDoc): RestaurantUpdateArgs {
    return {
        id: row._id,
        name: row.name,
        cuisine: row.cuisine,
        addressLabel: row.address.label,
        ...coordsArg(row.address.enrichment?.coords),
        ...(row.details?.notes !== undefined ? { notes: row.details.notes } : {}),
        ...(row.details?.link !== undefined ? { link: row.details.link } : {}),
        ...(row.rating !== undefined ? { rating: row.rating } : {}),
        images: copyStoredImages(row.images),
        visibility: row.visibility,
    }
}

export function toAddArgs(row: RestaurantDoc): RestaurantAddArgs {
    return {
        name: row.name,
        cuisine: row.cuisine,
        addressLabel: row.address.label,
        ...(row.details?.notes !== undefined && row.details.notes !== "" ? { notes: row.details.notes } : {}),
        ...(row.details?.link !== undefined && row.details.link !== "" ? { link: row.details.link } : {}),
        ...coordsArg(row.address.enrichment?.coords),
        ...(row.address.enrichment?.placeId !== undefined ? { placeId: row.address.enrichment.placeId } : {}),
        images: copyStoredImages(row.images),
        ...(row.clientMutationId !== undefined ? { clientMutationId: row.clientMutationId } : {}),
    }
}

function isTempRestaurantId(id: Id<"restaurants">): boolean {
    return isTempId(String(id))
}

// See ADR-0002: temp ids never travel; resolve by key.
export function assertRealRestaurantId(id: Id<"restaurants">): void {
    assertRealId(String(id))
}

export type TempRestaurantInput = RestaurantAddArgs &
    Readonly<{ ownerId: string; ownerName: string; clientMutationId: string }>

export function buildTempRestaurant(input: TempRestaurantInput): RestaurantDoc {
    const now = Date.now()
    const tempId = toId<"restaurants">(`${TEMP_ID_PREFIX}${crypto.randomUUID()}`)
    return {
        _id: tempId,
        _creationTime: now,
        ownerId: input.ownerId,
        ownerName: input.ownerName,
        name: input.name,
        cuisine: input.cuisine,
        address: {
            label: input.addressLabel,
            ...(input.coords !== undefined || input.placeId !== undefined
                ? {
                      enrichment: {
                          ...(input.placeId !== undefined ? { placeId: input.placeId } : {}),
                          ...(input.coords !== undefined ? { coords: { ...input.coords } } : {}),
                      },
                  }
                : {}),
        },
        ...(input.notes !== undefined || input.link !== undefined
            ? {
                  details: {
                      ...(input.notes !== undefined ? { notes: input.notes } : {}),
                      ...(input.link !== undefined ? { link: input.link } : {}),
                  },
              }
            : {}),
        images: copyStoredImages(input.images ?? []),
        visibility: "private",
        clientMutationId: input.clientMutationId,
        createdAt: now,
    }
}

export type SyncedRows = {
    values(): Iterable<RestaurantDoc>
}

// See ADR-0002: timeout is not failure; retry on the same key.
export class SyncTimeoutError extends Error {
    readonly code = "SYNC_TIMEOUT" as const

    constructor(message = "Timed out waiting for the synced restaurant") {
        super(message)
        this.name = "SyncTimeoutError"
    }

    static is(error: unknown): error is SyncTimeoutError {
        return error instanceof SyncTimeoutError && error.code === "SYNC_TIMEOUT"
    }
}

// See ADR-0002: resolve synced row by key, skip temp row.
export async function resolveRestaurantIdByKey(
    rows: SyncedRows,
    clientMutationId: string,
    timeoutMs = 15000,
): Promise<Id<"restaurants">> {
    const startedAt = Date.now()
    for (;;) {
        for (const row of rows.values()) {
            if (row.clientMutationId === clientMutationId && !isTempRestaurantId(row._id)) {
                return row._id
            }
        }
        if (Date.now() - startedAt >= timeoutMs) {
            throw new SyncTimeoutError()
        }
        await sleep(SYNC_RESOLVE_POLL_MS)
    }
}

function createRestaurantCollections(syncClient: SyncClient, persist: RestaurantPersist) {
    const shared = {
        client: syncClient,
        getKey: (item: RestaurantDoc) => item._id,
        onUpdate: async ({ transaction }: { transaction: { mutations: { modified: RestaurantDoc }[] } }) => {
            for (const mutation of transaction.mutations) {
                await persist.updateRestaurant(toUpdateArgs(mutation.modified))
            }
        },
        onInsert: async ({ transaction }: { transaction: { mutations: { modified: RestaurantDoc }[] } }) => {
            for (const mutation of transaction.mutations) {
                await persist.addRestaurant(toAddArgs(mutation.modified))
            }
        },
    }
    return {
        owner: createCollection(convexCollectionOptions({ ...shared, query: api.restaurants.get, queryArgs: {} })),
        feed: createCollection(convexCollectionOptions({ ...shared, query: api.restaurants.feed, queryArgs: {} })),
    }
}

const collectionCache = new WeakMap<
    object,
    { sessionKey: string; collections: ReturnType<typeof createRestaurantCollections> }
>()

// See ADR-0002: collections scoped per session, no cross-session leaks.
export function getSessionCollections(
    syncClient: SyncClient,
    persist: RestaurantPersist,
    sessionKey: string,
): ReturnType<typeof createRestaurantCollections> {
    const hit = collectionCache.get(syncClient)
    if (hit !== undefined && hit.sessionKey === sessionKey) {
        return hit.collections
    }
    const created = createRestaurantCollections(syncClient, persist)
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

const USER_SCOPED_QUERY_PREFIXES = [
    "restaurants:",
    "friendships:",
    "social:",
    "users:",
    "groups:",
    "shares:",
    "plans:",
    "invitations:",
]

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
