import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import {
    createGroupRecord,
    getGroupView,
    groupListEntryValidator,
    groupViewValidator,
    leaveGroupRecord,
    listGroups,
} from "./model/groups/groups"
import { GROUP_LIMIT } from "./model/groups/memberships"
import { requireProfile, signedInProfile } from "./model/identity/profiles"

export const create = mutation({
    args: {
        name: v.string(),
    },
    returns: v.id("groups"),
    handler: async (ctx, args) => createGroupRecord(ctx.db, (await requireProfile(ctx))._id, args.name),
})

export const leave = mutation({
    args: {
        groupId: v.id("groups"),
    },
    returns: v.id("groupMembers"),
    handler: async (ctx, args) => leaveGroupRecord(ctx.db, (await requireProfile(ctx))._id, args.groupId),
})

export const list = query({
    args: {},
    returns: v.array(groupListEntryValidator),
    handler: async (ctx) => {
        const me = await signedInProfile(ctx)
        if (me === null) {
            return []
        }
        return listGroups(ctx.db, me._id, GROUP_LIMIT)
    },
})

export const get = query({
    args: {
        groupId: v.id("groups"),
    },
    returns: v.union(groupViewValidator, v.null()),
    handler: async (ctx, args) => {
        const me = await signedInProfile(ctx)
        // See ADR-0004: null for missing or invisible.
        if (me === null) {
            return null
        }
        return getGroupView(ctx.db, me._id, args.groupId)
    },
})
