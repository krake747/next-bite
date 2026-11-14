import { v } from "convex/values"

import { internal } from "./_generated/api"
import { type Id } from "./_generated/dataModel"
import { action, internalQuery, mutation, query, type ActionCtx } from "./_generated/server"
import { googleMapsApiKey } from "./env"
import { requireProfile, signedInProfile } from "./model/identity/profiles"
<import { fetchPlaceAtmosphere, type AtmosphereData } from "./model/places/atmosphere"
import { fetchPlaceDetails, type PlaceDetailsResult } from "./model/places/details"
import { fetchOpeningHours, type OpeningHoursData } from "./model/places/hours"
import { fetchPlaceLocation, type PlaceLocationData } from "./model/places/location"
import {
    addToGroupRecord,
    createPlaceRecord,
    feedCards,
    forGroupCards,
    getCard,
    googlePlaceIdForViewer,
    mineCards,
    placeCardValidator,
    removeFromGroupRecord,
    saveStatusValidator,
    setSaveRecord,
} from "./model/places/places"
import {
    openingHoursValidator,
    photoInputValidator,
    placeDetailsTierValidator,
    placeDetailsValidator,
    placeGoogleInputValidator,
    placeLocationValidator,
    atmosphereValidator,
} from "./validators"

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
        return googlePlaceIdForViewer(ctx.db, userId, args.placeId)
    },
})

export const _placeForLocation = internalQuery({
    args: { placeId: v.id("places") },
    returns: v.string(),
    handler: async (ctx, args) => {
        const userId = (await requireProfile(ctx))._id
        return googlePlaceIdForViewer(ctx.db, userId, args.placeId)
    },
})

export const _placeForAtmosphere = internalQuery({
    args: { placeId: v.id("places") },
    returns: v.string(),
    handler: async (ctx, args) => {
        const userId = (await requireProfile(ctx))._id
        return googlePlaceIdForViewer(ctx.db, userId, args.placeId)
    },
})

export const _placeForDetails = internalQuery({
    args: { placeId: v.id("places") },
    returns: v.string(),
    handler: async (ctx, args) => {
        const userId = (await requireProfile(ctx))._id
        return googlePlaceIdForViewer(ctx.db, userId, args.placeId)
    },
})

export const create = mutation({
    args: {
        name: v.string(),
        cuisine: v.optional(v.string()),
        addressLabel: v.string(),
        google: v.optional(placeGoogleInputValidator),
        note: v.optional(v.string()),
        link: v.optional(v.string()),
        photos: v.array(photoInputValidator),
        mutationKey: v.optional(v.string()),
    },
    returns: v.id("places"),
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        return createPlaceRecord(
            ctx,
            me._id,
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
        )
    },
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
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        return setSaveRecord(ctx.db, me._id, args.placeId, args.status)
    },
})

export const addToGroup = mutation({
    args: {
        groupId: v.id("groups"),
        placeId: v.id("places"),
    },
    returns: v.id("groupPlaces"),
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        return addToGroupRecord(ctx.db, me._id, args.groupId, args.placeId)
    },
})

export const removeFromGroup = mutation({
    args: {
        groupId: v.id("groups"),
        placeId: v.id("places"),
    },
    returns: v.id("groupPlaces"),
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        return removeFromGroupRecord(ctx.db, me._id, args.groupId, args.placeId)
    },
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

export const location = action({
    args: { placeId: v.id("places") },
    returns: v.union(placeLocationValidator, v.null()),
    handler: async (ctx, args): Promise<PlaceLocationData | null> => {
        await requireActionProfile(ctx)
        const placeId = await ctx.runQuery(internal.places._placeForLocation, { placeId: args.placeId })
        return fetchPlaceLocation(placeId, googleMapsApiKey())
    },
})

// Seam stub for #230. The tiered details action with the Atmosphere mask lands
// via #228; this narrow atmosphere action fetches only the Atmosphere fields
// so the detail screen has a seam to consume now. Fold it into
// details(tier="atmosphere") when #228 lands and switch the frontend hook.
export const atmosphere = action({
    args: { placeId: v.id("places") },
    returns: atmosphereValidator,
    handler: async (ctx, args): Promise<AtmosphereData> => {
        await requireActionProfile(ctx)
        const placeId = await ctx.runQuery(internal.places._placeForAtmosphere, { placeId: args.placeId })
        return fetchPlaceAtmosphere(placeId, googleMapsApiKey())
    },
})

export const details = action({
    args: { placeId: v.id("places"), tier: placeDetailsTierValidator },
    returns: placeDetailsValidator,
    handler: async (ctx, args): Promise<PlaceDetailsResult> => {
        await requireActionProfile(ctx)
        const placeId = await ctx.runQuery(internal.places._placeForDetails, { placeId: args.placeId })
        return fetchPlaceDetails(placeId, googleMapsApiKey(), args.tier)
    },
})
