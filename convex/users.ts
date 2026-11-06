import { v } from "convex/values"

import { type Doc } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
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

export const updateMe = mutation({
    args: {
        name: v.optional(v.string()),
        avatar: v.optional(imageObjectValidator),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx)
        if (args.name === undefined && args.avatar === undefined) {
            throw new Error("Nothing to update: provide name or avatar")
        }
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
            .unique()
        if (!profile) {
            // First save from the onboarding form: no profile row exists yet. The auth record
            // supplies the email so the onboarding path needs no separate ensure call.
            const authUser = await readAuthUser(ctx)
            if (!authUser?.email) {
                throw new Error("Profile not found: call ensureProfile first")
            }
            return ctx.db.insert("profiles", {
                authUserId: userId,
                name: formatDisplayName(args.name ?? authUser?.email ?? ""),
                email: authUser.email,
                ...(args.avatar !== undefined ? { avatar: args.avatar } : {}),
                createdAt: Date.now(),
            })
        }
        await ctx.db.patch(profile._id, {
            ...(args.name !== undefined ? { name: formatDisplayName(args.name) } : {}),
            ...(args.avatar !== undefined ? { avatar: args.avatar } : {}),
        })
        return profile._id
    },
})
