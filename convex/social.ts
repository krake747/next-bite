import { v } from "convex/values"

import { type Id } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import {
    getProfiles,
    nameOf,
    profileByEmail,
    profileSummaryValidator,
    requireProfile,
    signedInProfile,
} from "./model/identity/profiles"
import {
    acceptFriendship,
    endFriendship,
    FRIEND_LIMIT,
    friendIds,
    incomingRequestIds,
    outgoingRequestIds,
    REQUEST_LIMIT,
    requestFriendship,
} from "./model/social/friendships"

type ProfileSummary = { profileId: Id<"profiles">; name: string }

async function summaries(ctx: QueryCtx, ids: ReadonlyArray<Id<"profiles">>): Promise<ProfileSummary[]> {
    const names = await getProfiles(ctx.db, ids)
    return ids.map((profileId) => ({ profileId, name: nameOf(names, profileId) }))
}

export const friends = query({
    args: {},
    returns: v.array(profileSummaryValidator),
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (me === null) {
            return []
        }
        return summaries(ctx, await friendIds(ctx.db, me._id, FRIEND_LIMIT))
    },
})

export const requests = query({
    args: {},
    returns: v.object({
        incoming: v.array(profileSummaryValidator),
        outgoing: v.array(profileSummaryValidator),
    }),
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (me === null) {
            return { incoming: [], outgoing: [] }
        }
        const [incoming, outgoing] = await Promise.all([
            incomingRequestIds(ctx.db, me._id, REQUEST_LIMIT),
            outgoingRequestIds(ctx.db, me._id, REQUEST_LIMIT),
        ])
        return { incoming: await summaries(ctx, incoming), outgoing: await summaries(ctx, outgoing) }
    },
})

export const requestByEmail = mutation({
    args: {
        email: v.string(),
    },
    returns: v.union(v.literal("pending"), v.literal("accepted")),
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        if (args.email.trim() === "") {
            throw new Error("Email is required")
        }
        const friend = await profileByEmail(ctx.db, args.email)
        if (friend === null) {
            throw new Error("Nobody joined with that email yet")
        }
        return requestFriendship(ctx.db, me._id, friend._id)
    },
})

export const accept = mutation({
    args: {
        friendId: v.id("profiles"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        await acceptFriendship(ctx.db, me._id, args.friendId)
        return null
    },
})

export const remove = mutation({
    args: {
        friendId: v.id("profiles"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const me = await requireProfile(ctx)
        await endFriendship(ctx.db, me._id, args.friendId)
        return null
    },
})
