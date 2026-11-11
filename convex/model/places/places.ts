import { type GenericDatabaseReader, type GenericDatabaseWriter, type StorageWriter } from "convex/server"
import { v } from "convex/values"

import { MAX_IMAGES } from "../../../src/core/constants"
import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"
import { memberGroupIds, requireMember } from "../groups/memberships"
import { getProfiles, nameOf } from "../identity/profiles"
import { areFriends, friendIds } from "../social/friendships"
import { type PhotoInput, claimPhoto } from "./photos"
import { placesTables } from "./schema"

export const MINE_TAKE = 200
export const FEED_FRIENDS = 100
export const FEED_PER_FRIEND = 10
export const FEED_TOTAL = 30
export const WANT_COUNT_TAKE = 100
export const GROUP_SCAN = 20
export const GROUP_PLACES_TAKE = 200

export const placeValidator = v.object({
    _id: v.id("places"),
    _creationTime: v.number(),
    ...placesTables.places.validator.fields,
})

export const cardPhotoValidator = v.object({
    url: v.string(),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    storageId: v.id("_storage"),
})

export const saveStatusValidator = v.union(v.literal("want"), v.literal("been"))

export const placeCardValidator = v.object({
    ...placeValidator.fields,
    ownerName: v.string(),
    photos: v.array(cardPhotoValidator),
    mySave: v.union(saveStatusValidator, v.null()),
    wantCount: v.union(v.number(), v.string()),
})

export type PlaceId = Id<"places">
export type ProfileId = Id<"profiles">

export type PlaceFields = {
    readonly name: string
    readonly cuisine?: string
    readonly addressLabel: string
    readonly google?: Doc<"places">["address"]["google"]
    readonly note?: string
    readonly link?: string
}

function fail(message: string): never {
    throw new Error(message)
}

function cleanText(value: string | undefined, max: number, what: string): string | undefined {
    if (value === undefined) {
        return undefined
    }
    const trimmed = value.trim()
    if (trimmed === "") {
        return undefined
    }
    if (trimmed.length > max) {
        fail(`${what} must be at most ${max} characters`)
    }
    return trimmed
}

function cleanName(name: string): string {
    const trimmed = name.trim()
    if (trimmed === "" || trimmed.length > 120) {
        fail("Name must be 1-120 characters")
    }
    return trimmed
}

function cleanAddressLabel(label: string): string {
    const trimmed = label.trim()
    if (trimmed === "" || trimmed.length > 200) {
        fail("Address must be 1-200 characters")
    }
    return trimmed
}

export async function createPlaceRecord(
    ctx: { readonly db: GenericDatabaseWriter<DataModel>; readonly storage: StorageWriter },
    ownerId: ProfileId,
    fields: PlaceFields,
    photoInputs: ReadonlyArray<PhotoInput>,
    mutationKey: string | undefined,
): Promise<PlaceId> {
    const name = cleanName(fields.name)
    const cuisine = cleanText(fields.cuisine, 80, "Cuisine")
    const addressLabel = cleanAddressLabel(fields.addressLabel)
    const note = cleanText(fields.note, 2000, "Notes")
    const link = cleanText(fields.link, 2000, "Link")
    if (photoInputs.length > MAX_IMAGES) {
        fail(`Maximum ${MAX_IMAGES} photos allowed`)
    }
    if (mutationKey !== undefined) {
        const prior = await ctx.db
            .query("clientMutations")
            .withIndex("by_user_key", (q) => q.eq("userId", ownerId).eq("key", mutationKey))
            .unique()
        if (prior !== null) {
            return prior.placeId
        }
    }
    const placeId = await ctx.db.insert("places", {
        ownerId,
        name,
        ...(cuisine !== undefined ? { cuisine } : {}),
        address: {
            label: addressLabel,
            ...(fields.google !== undefined ? { google: fields.google } : {}),
        },
        ...(note !== undefined ? { note } : {}),
        ...(link !== undefined ? { link } : {}),
        ...(mutationKey !== undefined ? { clientMutationId: mutationKey } : {}),
    })
    for (const input of photoInputs) {
        await claimPhoto(ctx, placeId, input)
    }
    if (mutationKey !== undefined) {
        await ctx.db.insert("clientMutations", { key: mutationKey, userId: ownerId, placeId })
    }
    return placeId
}

export async function isPlaceInGroup(
    db: GenericDatabaseReader<DataModel>,
    groupId: Id<"groups">,
    placeId: Id<"places">,
): Promise<boolean> {
    const link = await db
        .query("groupPlaces")
        .withIndex("by_group_place", (q) => q.eq("groupId", groupId).eq("placeId", placeId))
        .unique()
    return link !== null
}

export async function placeNames(
    db: GenericDatabaseReader<DataModel>,
    ids: ReadonlyArray<Id<"places">>,
): Promise<ReadonlyMap<Id<"places">, string>> {
    const unique = [...new Set(ids)]
    const places = await Promise.all(unique.map(async (id) => db.get("places", id)))
    return new Map(
        unique.flatMap((id, index) => {
            const place = places[index]
            return place === undefined || place === null ? [] : [[id, place.name] as const]
        }),
    )
}

export async function canViewPlace(
    db: GenericDatabaseReader<DataModel>,
    viewerId: ProfileId,
    place: Doc<"places">,
): Promise<boolean> {
    if (place.ownerId === viewerId) {
        return true
    }
    if (await areFriends(db, place.ownerId, viewerId)) {
        return true
    }
    for (const groupId of await memberGroupIds(db, viewerId, GROUP_SCAN)) {
        const link = await db
            .query("groupPlaces")
            .withIndex("by_group_place", (q) => q.eq("groupId", groupId).eq("placeId", place._id))
            .unique()
        if (link !== null) {
            return true
        }
    }
    return false
}

type CardPhotoInput = {
    url: string
    storageId: Id<"_storage">
    width?: number
    height?: number
}

function toCardPhoto(photo: Doc<"photos">): CardPhotoInput {
    const out: CardPhotoInput = { url: photo.url, storageId: photo.storageId }
    if (photo.width !== undefined) {
        out.width = photo.width
    }
    if (photo.height !== undefined) {
        out.height = photo.height
    }
    return out
}

export type PlaceCard = Doc<"places"> & {
    readonly ownerName: string
    readonly photos: CardPhotoInput[]
    readonly mySave: "want" | "been" | null
    readonly wantCount: number | string
}

async function assembleCards(
    db: GenericDatabaseReader<DataModel>,
    places: ReadonlyArray<Doc<"places">>,
    viewerId: ProfileId | null,
): Promise<PlaceCard[]> {
    const names = await getProfiles(
        db,
        places.map((place) => place.ownerId),
    )
    return Promise.all(
        places.map(async (place) => {
            const photos = await db
                .query("photos")
                .withIndex("by_place", (q) => q.eq("placeId", place._id))
                .take(MAX_IMAGES)
            const [save, saves] = await Promise.all([
                viewerId === null
                    ? null
                    : db
                          .query("saves")
                          .withIndex("by_user_place", (q) => q.eq("userId", viewerId).eq("placeId", place._id))
                          .unique(),
                db
                    .query("saves")
                    .withIndex("by_place", (q) => q.eq("placeId", place._id))
                    .take(WANT_COUNT_TAKE),
            ])
            const wants = saves.filter((row) => row.status === "want").length
            return {
                ...place,
                ownerName: nameOf(names, place.ownerId),
                photos: photos.map((photo) => toCardPhoto(photo)),
                mySave: save?.status ?? null,
                wantCount: saves.length === WANT_COUNT_TAKE ? "99+" : wants,
            }
        }),
    )
}

export async function feedCards(db: GenericDatabaseReader<DataModel>, viewerId: ProfileId): Promise<PlaceCard[]> {
    const found: Doc<"places">[] = []
    for (const ownerId of await friendIds(db, viewerId, FEED_FRIENDS)) {
        const owned = await db
            .query("places")
            .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
            .order("desc")
            .take(FEED_PER_FRIEND)
        found.push(...owned)
    }
    const newest = found.toSorted((a, b) => b._creationTime - a._creationTime).slice(0, FEED_TOTAL)
    return assembleCards(db, newest, viewerId)
}

export async function mineCards(db: GenericDatabaseReader<DataModel>, viewerId: ProfileId): Promise<PlaceCard[]> {
    const owned = await db
        .query("places")
        .withIndex("by_owner", (q) => q.eq("ownerId", viewerId))
        .order("desc")
        .take(MINE_TAKE)
    return assembleCards(db, owned, viewerId)
}

export async function getCard(
    db: GenericDatabaseReader<DataModel>,
    viewerId: ProfileId | null,
    placeId: PlaceId,
): Promise<PlaceCard | null> {
    const place = await db.get("places", placeId)
    if (place === null) {
        return null
    }
    if (viewerId === null || !(await canViewPlace(db, viewerId, place))) {
        return null
    }
    const [card] = await assembleCards(db, [place], viewerId)
    return card ?? null
}

export async function setSaveRecord(
    db: GenericDatabaseWriter<DataModel>,
    userId: ProfileId,
    placeId: PlaceId,
    status: "want" | "been" | null,
): Promise<Id<"saves"> | null> {
    const place = await db.get("places", placeId)
    if (place === null) {
        throw new Error("Place not found")
    }
    if (!(await canViewPlace(db, userId, place))) {
        throw new Error("Unauthorized: place is not visible to you")
    }
    const existing = await db
        .query("saves")
        .withIndex("by_user_place", (q) => q.eq("userId", userId).eq("placeId", placeId))
        .unique()
    if (status === null) {
        if (existing !== null) {
            await db.delete("saves", existing._id)
        }
        return null
    }
    if (existing !== null) {
        if (existing.status !== status) {
            await db.patch("saves", existing._id, { status, updatedAt: Date.now() })
        }
        return existing._id
    }
    return db.insert("saves", { placeId, userId, status, updatedAt: Date.now() })
}

export async function addToGroupRecord(
    db: GenericDatabaseWriter<DataModel>,
    userId: ProfileId,
    groupId: Id<"groups">,
    placeId: PlaceId,
): Promise<Id<"groupPlaces">> {
    await requireMember(db, groupId, userId)
    const place = await db.get("places", placeId)
    if (place === null) {
        throw new Error("Place not found")
    }
    if (!(await canViewPlace(db, userId, place))) {
        throw new Error("Unauthorized: place is not visible to you")
    }
    const existing = await db
        .query("groupPlaces")
        .withIndex("by_group_place", (q) => q.eq("groupId", groupId).eq("placeId", placeId))
        .unique()
    if (existing !== null) {
        return existing._id
    }
    return db.insert("groupPlaces", { groupId, placeId, addedBy: userId })
}

export async function removeFromGroupRecord(
    db: GenericDatabaseWriter<DataModel>,
    userId: ProfileId,
    groupId: Id<"groups">,
    placeId: PlaceId,
): Promise<Id<"groupPlaces">> {
    await requireMember(db, groupId, userId)
    const existing = await db
        .query("groupPlaces")
        .withIndex("by_group_place", (q) => q.eq("groupId", groupId).eq("placeId", placeId))
        .unique()
    if (existing === null) {
        throw new Error("Place is not in this group")
    }
    await db.delete("groupPlaces", existing._id)
    return existing._id
}

export async function forGroupCards(
    db: GenericDatabaseReader<DataModel>,
    viewerId: ProfileId,
    groupId: Id<"groups">,
): Promise<PlaceCard[]> {
    await requireMember(db, groupId, viewerId)
    const links = await db
        .query("groupPlaces")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .take(GROUP_PLACES_TAKE)
    const places = await Promise.all(links.map(async (link) => db.get("places", link.placeId)))
    return assembleCards(
        db,
        places.flatMap((place) => (place === null ? [] : [place])),
        viewerId,
    )
}
