import { v } from "convex/values"

import { type Doc, type Id } from "./_generated/dataModel"
import { internalQuery, mutation, query, type MutationCtx } from "./_generated/server"
import { authComponent } from "./auth"
import { formatDisplayName, readAuthUser } from "./helpers"
import { profileByAuthUser, signedInProfile, viewerProfile } from "./model/identity/profiles"
import { imageObjectValidator } from "./validators"

async function requireSubject(ctx: MutationCtx): Promise<string> {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
        throw new Error("Unauthorized: authentication required")
    }
    return identity.subject
}

export const ensureProfile = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const subject = await requireSubject(ctx)
        const existing = await profileByAuthUser(ctx.db, subject)
        if (existing) {
            return existing._id
        }
        const authUser = await readAuthUser(ctx)
        const name = formatDisplayName(args.name ?? authUser?.name ?? authUser?.email ?? args.email)
        return ctx.db.insert("profiles", {
            authUserId: subject,
            name,
            email: args.email.trim().toLowerCase(),
        })
    },
})

export const getSessionUser = query({
    args: {},
    handler: async (ctx): Promise<{ id: string; email: string; name: string | null; image: string | null } | null> => {
        const user = await authComponent.safeGetAuthUser(ctx)
        if (!user) {
            return null
        }
        return { id: user._id, email: user.email, name: user.name, image: user.image ?? null }
    },
})

export const getMe = query({
    args: {},
    handler: async (ctx): Promise<{ status: "ready"; profile: Doc<"profiles"> } | { status: "onboarding" }> => {
        const profile = await signedInProfile(ctx)
        if (!profile) {
            return { status: "onboarding" }
        }
        return { status: "ready", profile }
    },
})

export const _viewerProfileId = internalQuery({
    args: {},
    handler: async (ctx): Promise<Id<"profiles"> | null> => (await viewerProfile(ctx))?._id ?? null,
})

type AvatarInput = {
    url: string
    storageId: Id<"_storage">
    width?: number | undefined
    height?: number | undefined
}

async function resolveAvatarUpload(
    ctx: MutationCtx,
    profileId: Id<"profiles">,
    avatar: AvatarInput,
): Promise<NonNullable<Doc<"profiles">["avatar"]>> {
    const record = await ctx.db
        .query("uploads")
        .withIndex("by_storage", (q) => q.eq("storageId", avatar.storageId))
        .unique()
    if (!record || record.ownerId !== profileId) {
        throw new Error("Unauthorized: storage does not belong to you")
    }
    await ctx.db.patch(record._id, { purpose: "avatar", expiresAt: undefined })
    const url = (await ctx.storage.getUrl(avatar.storageId)) ?? avatar.url
    return {
        url,
        storageId: avatar.storageId,
        ownerId: profileId,
        ...(record.mimeType !== undefined ? { mimeType: record.mimeType } : {}),
        ...(record.byteSize !== undefined ? { byteSize: record.byteSize } : {}),
        ...(avatar.width !== undefined ? { width: avatar.width } : {}),
        ...(avatar.height !== undefined ? { height: avatar.height } : {}),
    }
}

async function profileForUpdate(ctx: MutationCtx, name: string | undefined): Promise<Doc<"profiles">> {
    const subject = await requireSubject(ctx)
    const existing = await profileByAuthUser(ctx.db, subject)
    if (existing) {
        return existing
    }
    const authUser = await readAuthUser(ctx)
    if (!authUser?.email) {
        throw new Error("Profile not found: call ensureProfile first")
    }
    const profileId = await ctx.db.insert("profiles", {
        authUserId: subject,
        name: formatDisplayName(name ?? authUser.email),
        email: authUser.email,
    })
    const created = await ctx.db.get("profiles", profileId)
    if (!created) {
        throw new Error("Profile not found: call ensureProfile first")
    }
    return created
}

export const updateMe = mutation({
    args: {
        name: v.optional(v.string()),
        avatar: v.optional(imageObjectValidator),
        removeAvatar: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        if (args.name === undefined && args.avatar === undefined && args.removeAvatar !== true) {
            throw new Error("Nothing to update: provide name or avatar")
        }
        const profile = await profileForUpdate(ctx, args.name)
        const avatar = args.avatar !== undefined ? await resolveAvatarUpload(ctx, profile._id, args.avatar) : undefined
        await ctx.db.patch(profile._id, {
            ...(args.name !== undefined ? { name: formatDisplayName(args.name) } : {}),
            ...(avatar !== undefined ? { avatar } : {}),
            ...(args.removeAvatar === true ? { avatar: undefined } : {}),
        })
        return profile._id
    },
})
