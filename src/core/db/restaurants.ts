import { convexCollectionOptions } from "@tanstack/convex-db-collection"
import { createCollection } from "@tanstack/db"
import { type ConvexReactClient } from "convex/react"

import { api } from "@convex/_generated/api"
import { type Doc, type Id } from "@convex/_generated/dataModel"

import { sleep } from "../async"
import { mergeDetails, mergeEnrichment } from "../restaurant-details"
import { assertRealId, isTempId, TEMP_ID_PREFIX } from "../temp-ids"

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
        // Same contract as the server write: the preview and the persisted
        // row agree, so there is no optimistic drift to heal on sync.
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
        images: copyStoredImages(row.images),
        ...(row.clientMutationId !== undefined ? { clientMutationId: row.clientMutationId } : {}),
    }
}

function isTempRestaurantId(id: Id<"restaurants">): boolean {
    return isTempId(String(id))
}

// Optimistic rows carry fabricated ids that the backend will reject. Nothing navigates to or
// mutates against them: inserts resolve to the synced server id, and direct writes refuse them.
export function assertRealRestaurantId(id: Id<"restaurants">): void {
    assertRealId(String(id))
}

export type TempRestaurantInput = RestaurantAddArgs &
    Readonly<{ ownerId: string; ownerName: string; clientMutationId: string }>

export function buildTempRestaurant(input: TempRestaurantInput): RestaurantDoc {
    const now = Date.now()
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- client-only placeholder id replaced by the server row on sync
    const tempId = `${TEMP_ID_PREFIX}${crypto.randomUUID()}` as unknown as Id<"restaurants">
    return {
        _id: tempId,
        _creationTime: now,
        ownerId: input.ownerId,
        ownerName: input.ownerName,
        name: input.name,
        cuisine: input.cuisine,
        address: {
            label: input.addressLabel,
            ...(input.coords !== undefined ? { enrichment: { coords: { ...input.coords } } } : {}),
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

// A timed-out wait is not proof of failure: the row may already exist
// server-side (see ADR-0017). Callers distinguish this from definitive errors
// to offer checking and retry on the same mutation key instead of minting a
// new identity that could duplicate the row.
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

// Matches a synced server row to the insert that created it via the persisted client mutation
// key. Skips the optimistic temp row itself, so callers never resolve to a fabricated id.
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

// Collections are scoped to one signed-in session. The Convex client instance outlives sign-in,
// so the cache slots per session key: a sign-out or account change drops the previous session's
// synced rows instead of leaking them into the next session. Abandoned collections release with
// their last live query; user-scoped TanStack Query entries are cleared alongside (see
// clearUserScopedQueries).
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

// Evict a session's cached collections so the next read builds a fresh
// subscription. Only evicts when the cached entry still belongs to the given
// session; never touches another session's collections. Used to recover from
// a poisoned mid-session subscription: the caller re-verifies auth, and the
// next render subscribes cleanly instead of reusing the failed sync.
export function dropSessionCollections(syncClient: SyncClient, sessionKey: string): boolean {
    const hit = collectionCache.get(syncClient)
    if (hit === undefined || hit.sessionKey !== sessionKey) {
        return false
    }
    collectionCache.delete(syncClient)
    return true
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
    // Runtime keys from @convex-dev/react-query are ["convexQuery", "module:function", args].
    const fn = queryKey[0] === "convexQuery" ? queryKey[1] : undefined
    return typeof fn === "string" && USER_SCOPED_QUERY_PREFIXES.some((prefix) => fn.startsWith(prefix))
}

export function clearUserScopedQueries(
    removeQueries: (filters: { predicate: (query: { queryKey: ReadonlyArray<unknown> }) => boolean }) => void,
): void {
    removeQueries({ predicate: (query) => isUserScopedQueryKey(query.queryKey) })
}

// The TanStack Query cache is shared across sessions in one tab, so user-scoped entries must be
// evicted when the owning session changes. Eviction runs only for ready sessions whose key
// differs from the recorded owner: mount-time runs while probing must not wipe the cache,
// because components that mount on loaded data (gated on collections) would unmount on the
// eviction and remount on the refetch in a loop. Rendered data now lives in the cache (the
// official adapter), unlike the previous hand-rolled adapter that kept it in component state.
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
