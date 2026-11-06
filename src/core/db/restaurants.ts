import { convexCollectionOptions } from "@tanstack/convex-db-collection"
import { createCollection } from "@tanstack/db"
import { type ConvexClient } from "convex/browser"

import { api } from "@convex/_generated/api"
import { type Doc, type Id } from "@convex/_generated/dataModel"

import { assertRealId, isTempId, TEMP_ID_PREFIX } from "../temp-ids"

function mergeDetailsPreview(
    existing: RestaurantDoc["details"],
    input: Readonly<{ notes?: string | undefined; link?: string | undefined }>,
): RestaurantDoc["details"] {
    // Mirrors the backend mergeDetails contract for the optimistic preview.
    // The server re-merges on write, so drift self-heals on sync.
    if (input.notes === undefined && input.link === undefined) {
        return existing
    }
    const notes = input.notes !== undefined && input.notes !== "" ? input.notes : existing?.notes
    const link = input.link !== undefined && input.link !== "" ? input.link : existing?.link
    if (notes === undefined && link === undefined) {
        return undefined
    }
    return { ...(notes !== undefined ? { notes } : {}), ...(link !== undefined ? { link } : {}) }
}

function mergeCoordsPreview(
    existing: RestaurantDoc["address"]["enrichment"],
    coords: RestaurantCoords | undefined,
): RestaurantDoc["address"]["enrichment"] {
    if (coords === undefined) {
        return existing
    }
    return {
        ...existing,
        coords: { lat: coords.lat, lng: coords.lng },
    }
}

export type RestaurantDoc = Doc<"restaurants">

export type SyncClient = Pick<ConvexClient, "onUpdate">

export type RestaurantCoords = {
    readonly lat: number
    readonly lng: number
}

export type RestaurantImageInput = {
    readonly url: string
    readonly storageId: string
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

export function copyStoredImages(
    images: ReadonlyArray<Readonly<{ url: string; storageId: string }>>,
): RestaurantImageInput[] {
    return images.map((img) => ({ url: img.url, storageId: img.storageId }))
}

export function persistCallerFor(client: ConvexClient): RestaurantPersist {
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
        const enrichment = mergeCoordsPreview(draft.address.enrichment, args.coords)
        draft.address = {
            label: args.addressLabel ?? draft.address.label,
            ...(enrichment !== undefined ? { enrichment } : {}),
        }
    }
    if (args.notes !== undefined || args.link !== undefined) {
        const details = mergeDetailsPreview(draft.details, { notes: args.notes, link: args.link })
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
        ...(row.address.enrichment?.coords !== undefined
            ? { coords: { lat: row.address.enrichment.coords.lat, lng: row.address.enrichment.coords.lng } }
            : {}),
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
        ...(row.address.enrichment?.coords !== undefined
            ? { coords: { lat: row.address.enrichment.coords.lat, lng: row.address.enrichment.coords.lng } }
            : {}),
        images: copyStoredImages(row.images),
        ...(row.clientMutationId !== undefined ? { clientMutationId: row.clientMutationId } : {}),
    }
}

export function isTempRestaurantId(id: Id<"restaurants">): boolean {
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
            throw new Error("Timed out waiting for the synced restaurant")
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 50)
        })
    }
}

export function createRestaurantCollections(syncClient: SyncClient, persist: RestaurantPersist) {
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

const USER_SCOPED_QUERY_PREFIXES = ["restaurants:", "friendships:", "social:", "users:", "groups:", "shares:"]

export function isUserScopedQueryKey(queryKey: ReadonlyArray<unknown>): boolean {
    const [namespace] = queryKey
    return typeof namespace === "string" && USER_SCOPED_QUERY_PREFIXES.some((prefix) => namespace.startsWith(prefix))
}

export function clearUserScopedQueries(
    removeQueries: (filters: { predicate: (query: { queryKey: ReadonlyArray<unknown> }) => boolean }) => void,
): void {
    removeQueries({ predicate: (query) => isUserScopedQueryKey(query.queryKey) })
}
