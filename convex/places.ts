import { v } from "convex/values"

import { internal } from "./_generated/api"
import { type Id } from "./_generated/dataModel"
import { action, internalQuery, mutation, query, type ActionCtx } from "./_generated/server"
import { googleMapsApiKey } from "./env"
import { requireProfile, signedInProfile } from "./model/identity/profiles"
import { fetchOpeningHours, type OpeningHoursData } from "./model/places/hours"
import {
    addToGroupRecord,
    canViewPlace,
    createPlaceRecord,
    feedCards,
    forGroupCards,
    getCard,
    mineCards,
    placeCardValidator,
    removeFromGroupRecord,
    saveStatusValidator,
    setSaveRecord,
} from "./model/places/places"
import { openingHoursValidator, placeGoogleValidator } from "./validators"

const photoInputValidator = v.object({
    storageId: v.id("_storage"),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
})

async function requireActionProfile(ctx: ActionCtx): Promise<Id<"profiles">> {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
        throw new Error("Unauthorized: authentication required")
    }
    const profileId = await ctx.runQuery(internal.identity._viewerProfileId, {})
    if (profileId === null) {
        throw new Error("Unauthorized: profile required")
    }
    return profileId
}

export const _placeForHours = internalQuery({
    args: { placeId: v.id("places") },
    returns: v.string(),
    handler: async (ctx, args) => {
        const userId = (await requireProfile(ctx))._id
        const place = await ctx.db.get("places", args.placeId)
        if (place === null) {
            throw new Error("Place not found")
        }
        if (!(await canViewPlace(ctx.db, userId, place))) {
            throw new Error("Unauthorized: place is not visible to you")
        }
        const placeId = place.address.google?.placeId
        if (placeId === undefined || placeId === "") {
            throw new Error("Place has no Google place id")
        }
        return placeId
    },
})

export const create = mutation({
    args: {
        name: v.string(),
        cuisine: v.optional(v.string()),
        addressLabel: v.string(),
        google: v.optional(placeGoogleValidator),
        note: v.optional(v.string()),
        link: v.optional(v.string()),
        photos: v.array(photoInputValidator),
        mutationKey: v.optional(v.string()),
    },
    returns: v.id("places"),
    handler: async (ctx, args) =>
        createPlaceRecord(
            ctx,
            (await requireProfile(ctx))._id,
            {
                name: args.name,
                ...(args.cuisine !== undefined ? { cuisine: args.cuisine } : {}),
                addressLabel: args.addressLabel,
                ...(args.google !== undefined ? { google: args.google } : {}),
                ...(args.note !== undefined ? { note: args.note } : {}),
                ...(args.link !== undefined ? { link: args.link } : {}),
            },
            args.photos,
            args.mutationKey,
        ),
})

export const mine = query({
    args: {},
    returns: v.array(placeCardValidator),
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (me === null) {
            return []
        }
        return mineCards(ctx.db, me._id)
    },
})

export const feed = query({
    args: {},
    returns: v.array(placeCardValidator),
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (me === null) {
            return []
        }
        return feedCards(ctx.db, me._id)
    },
})

export const get = query({
    args: { id: v.id("places") },
    returns: v.union(placeCardValidator, v.null()),
    handler: async (ctx, args) => {
        const me = await signedInProfile(ctx)
        // See ADR-0004: null for missing or invisible.
        return getCard(ctx.db, me?._id ?? null, args.id)
    },
})

export const setSave = mutation({
    args: {
        placeId: v.id("places"),
        status: v.union(saveStatusValidator, v.null()),
    },
    returns: v.union(v.id("saves"), v.null()),
    handler: async (ctx, args) => setSaveRecord(ctx.db, (await requireProfile(ctx))._id, args.placeId, args.status),
})

export const addToGroup = mutation({
    args: {
        groupId: v.id("groups"),
        placeId: v.id("places"),
    },
    returns: v.id("groupPlaces"),
    handler: async (ctx, args) => addToGroupRecord(ctx.db, (await requireProfile(ctx))._id, args.groupId, args.placeId),
})

export const removeFromGroup = mutation({
    args: {
        groupId: v.id("groups"),
        placeId: v.id("places"),
    },
    returns: v.id("groupPlaces"),
    handler: async (ctx, args) =>
        removeFromGroupRecord(ctx.db, (await requireProfile(ctx))._id, args.groupId, args.placeId),
})

export const forGroup = query({
    args: { groupId: v.id("groups") },
    returns: v.array(placeCardValidator),
    handler: async (ctx, args) => {
        const me = await signedInProfile(ctx)
        if (me === null) {
            return []
        }
        return forGroupCards(ctx.db, me._id, args.groupId)
    },
})

export const hours = action({
    args: { placeId: v.id("places") },
    returns: openingHoursValidator,
    handler: async (ctx, args): Promise<OpeningHoursData> => {
        await requireActionProfile(ctx)
        const placeId = await ctx.runQuery(internal.places._placeForHours, { placeId: args.placeId })
        return fetchOpeningHours(placeId, googleMapsApiKey())
    },
})
