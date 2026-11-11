import { v } from "convex/values"

import { type Doc, type Id } from "./_generated/dataModel"
import { internalQuery, mutation, query, type MutationCtx } from "./_generated/server"
import { authComponent } from "./auth"
import { readAuthUser } from "./helpers"
import {
    clearProfileAvatar,
    createProfile,
    profileByAuthUser,
    profileValidator,
    renameProfile,
    setProfileAvatar,
    signedInProfile,
    viewerProfile,
} from "./model/identity/profiles"
import { claimableImage } from "./storage"

const meValidator = v.union(
    v.object({ status: v.literal("ready"), profile: profileValidator }),
    v.object({ status: v.literal("onboarding") }),
)

const sessionUserValidator = v.union(
    v.null(),
    v.object({
        id: v.string(),
        email: v.string(),
        name: v.union(v.string(), v.null()),
        image: v.union(v.string(), v.null()),
    }),
)

async function requireSubject(ctx: MutationCtx): Promise<string> {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
        throw new Error("Unauthorized: authentication required")
    }
    return identity.subject
}

async function profileOrCreate(ctx: MutationCtx, name: string | undefined): Promise<Doc<"profiles">> {
    const subject = await requireSubject(ctx)
    const existing = await profileByAuthUser(ctx.db, subject)
    if (existing !== null) {
        return existing
    }
    const authUser = await readAuthUser(ctx)
    if (!authUser?.email) {
        throw new Error("Profile not found: call ensureProfile first")
    }
    const profileId = await createProfile(ctx.db, subject, name ?? authUser.name ?? authUser.email, authUser.email)
    const created = await ctx.db.get("profiles", profileId)
    if (created === null) {
        throw new Error("Profile not found: call ensureProfile first")
    }
    return created
}

export const me = query({
    args: {},
    returns: meValidator,
    handler: async (ctx) => {
        const profile = await signedInProfile(ctx)
        return profile === null ? { status: "onboarding" as const } : { status: "ready" as const, profile }
    },
})

export const ensureProfile = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
    },
    returns: v.id("profiles"),
    handler: async (ctx, args) => {
        const subject = await requireSubject(ctx)
        const existing = await profileByAuthUser(ctx.db, subject)
        if (existing !== null) {
            return existing._id
        }
        const authUser = await readAuthUser(ctx)
        return createProfile(ctx.db, subject, args.name ?? authUser?.name ?? authUser?.email ?? args.email, args.email)
    },
})

export const rename = mutation({
    args: {
        name: v.string(),
    },
    returns: v.id("profiles"),
    handler: async (ctx, args) => {
        const profile = await profileOrCreate(ctx, args.name)
        await renameProfile(ctx.db, profile._id, args.name)
        return profile._id
    },
})

export const setAvatar = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    returns: v.id("profiles"),
    handler: async (ctx, args) => {
        const profile = await profileOrCreate(ctx, undefined)
        if (profile.avatar?.storageId === args.storageId) {
            return profile._id
        }
        const image = await claimableImage(ctx, args.storageId)
        const url = await ctx.storage.getUrl(args.storageId)
        if (url === null) {
            throw new Error("Upload not found")
        }
        await setProfileAvatar(ctx.db, profile._id, { url, storageId: args.storageId, ownerId: profile._id, ...image })
        return profile._id
    },
})

export const removeAvatar = mutation({
    args: {},
    returns: v.id("profiles"),
    handler: async (ctx) => {
        const profile = await profileOrCreate(ctx, undefined)
        await clearProfileAvatar(ctx.db, profile._id)
        return profile._id
    },
})

export const sessionUser = query({
    args: {},
    returns: sessionUserValidator,
    handler: async (ctx) => {
        const user = await authComponent.safeGetAuthUser(ctx)
        if (!user) {
            return null
        }
        return { id: user._id, email: user.email, name: user.name, image: user.image ?? null }
    },
})

export const _viewerProfileId = internalQuery({
    args: {},
    returns: v.union(v.id("profiles"), v.null()),
    handler: async (ctx): Promise<Id<"profiles"> | null> => (await viewerProfile(ctx))?._id ?? null,
})
