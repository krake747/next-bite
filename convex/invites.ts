import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import {
    acceptInviteRecord,
    acceptResultValidator,
    createInviteRecord,
    getInviteView,
    inviteViewValidator,
    revokeInviteRecord,
} from "./model/groups/invites"
import { requireProfile } from "./model/identity/profiles"
import { inviteTargetValidator } from "./validators"

export const create = mutation({
    args: {
        target: inviteTargetValidator,
    },
    returns: v.string(),
    handler: async (ctx, args) => createInviteRecord(ctx.db, (await requireProfile(ctx))._id, args.target),
})

export const get = query({
    // See ADR-0005: bearer token, server-side accept.
    args: {
        token: v.string(),
        now: v.number(),
    },
    returns: inviteViewValidator,
    handler: async (ctx, args) => getInviteView(ctx.db, args.token, args.now),
})

export const accept = mutation({
    args: {
        token: v.string(),
    },
    returns: acceptResultValidator,
    handler: async (ctx, args) => acceptInviteRecord(ctx.db, (await requireProfile(ctx))._id, args.token),
})

export const revoke = mutation({
    args: {
        token: v.string(),
    },
    returns: v.object({ result: v.literal("revoked") }),
    handler: async (ctx, args) => revokeInviteRecord(ctx.db, (await requireProfile(ctx))._id, args.token),
})
