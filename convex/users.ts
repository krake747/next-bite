import { v } from "convex/values"

import { type Doc, type Id } from "./_generated/dataModel"
import { mutation, query, type MutationCtx } from "./_generated/server"
import { formatDisplayName, readAuthUser, requireUserId } from "./helpers"
import { imageObjectValidator } from "./validators"

export const ensureProfile = mutation({
    args: {
        email: v.string(),
        name: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        const existing = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
            .unique()
        if (existing) {
            return existing._id
        }
        const authUser = await readAuthUser(ctx)
        const name = formatDisplayName(args.name ?? authUser?.name ?? authUser?.email ?? args.email)
        return ctx.db.insert("profiles", {
            authUserId: userId,
            name,
            email: args.email.trim().toLowerCase(),
            createdAt: Date.now(),
        })
    },
})

export const getMe = query({
    args: {},
    handler: async (ctx): Promise<{ status: "ready"; profile: Doc<"profiles"> } | { status: "onboarding" }> => {
        const userId = await requireUserId(ctx)
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
            .unique()
        if (!profile) {
            return { status: "onboarding" }
        }
        return { status: "ready", profile }
    },
})

type AvatarInput = {
    url: string
    storageId: Id<"_storage">
    width?: number | undefined
    height?: number | undefined
}

// Avatar ownership is verified against the server upload record, and display
// metadata comes from the record and profile, never from client-claimed fields.
// Avatars mark the upload record so orphan sweeps skip them.
async function resolveAvatarUpload(
    ctx: MutationCtx,
    userId: string,
    displayName: string,
    avatar: AvatarInput,
): Promise<NonNullable<Doc<"profiles">["avatar"]>> {
    const record = await ctx.db
        .query("uploads")
        .withIndex("by_storage", (q) => q.eq("storageId", avatar.storageId))
        .unique()
    if (!record || record.ownerId !== userId) {
        throw new Error("Unauthorized: storage does not belong to you")
    }
    await ctx.db.patch(record._id, { purpose: "avatar", expiresAt: undefined })
    const url = (await ctx.storage.getUrl(avatar.storageId)) ?? avatar.url
    return {
        url,
        storageId: avatar.storageId,
        ownerId: userId,
        displayName,
        ...(record.mimeType !== undefined ? { mimeType: record.mimeType } : {}),
        ...(record.byteSize !== undefined ? { byteSize: record.byteSize } : {}),
        ...(avatar.width !== undefined ? { width: avatar.width } : {}),
        ...(avatar.height !== undefined ? { height: avatar.height } : {}),
    }
}

export const updateMe = mutation({
    args: {
        name: v.optional(v.string()),
        avatar: v.optional(imageObjectValidator),
        removeAvatar: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        if (args.name === undefined && args.avatar === undefined && args.removeAvatar !== true) {
            throw new Error("Nothing to update: provide name or avatar")
        }
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
            .unique()
        const displayName = profile?.name ?? formatDisplayName(args.name ?? (await readAuthUser(ctx))?.email ?? "")
        const avatar =
            args.avatar !== undefined ? await resolveAvatarUpload(ctx, userId, displayName, args.avatar) : undefined
        if (!profile) {
            // First save from the onboarding form: no profile row exists yet. The auth record
            // supplies the email so the onboarding path needs no separate ensure call.
            const authUser = await readAuthUser(ctx)
            if (!authUser?.email) {
                throw new Error("Profile not found: call ensureProfile first")
            }
            return ctx.db.insert("profiles", {
                authUserId: userId,
                name: displayName,
                email: authUser.email,
                ...(avatar !== undefined ? { avatar } : {}),
                createdAt: Date.now(),
            })
        }
        await ctx.db.patch(profile._id, {
            ...(args.name !== undefined ? { name: formatDisplayName(args.name) } : {}),
            ...(avatar !== undefined ? { avatar } : {}),
            // Patching with undefined deletes the field; an omitted avatar means no change.
            ...(args.removeAvatar === true ? { avatar: undefined } : {}),
        })
        return profile._id
    },
})
