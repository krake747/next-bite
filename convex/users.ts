import { v } from "convex/values"

import { type Doc } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import { requireUserId } from "./helpers"
import { imageObjectValidator } from "./validators"

function formatDisplayName(raw: string): string {
    const trimmed = raw.trim().slice(0, 60)
    return trimmed === "" ? "Someone" : trimmed
}

type AuthUserRecord = {
    name?: string | null | undefined
    email?: string | null | undefined
}

async function readAuthUser(ctx: Parameters<typeof authComponent.getAuthUser>[0]): Promise<AuthUserRecord | undefined> {
    try {
        return await authComponent.getAuthUser(ctx)
    } catch {
        return undefined
    }
}

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
            email: args.email,
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
        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_auth_user", (q) => q.eq("authUserId", userId))
            .unique()
        if (!profile) {
            throw new Error("Profile not found: call ensureProfile first")
        }
        if (args.name === undefined && args.avatar === undefined) {
            throw new Error("Nothing to update: provide name or avatar")
        }
        await ctx.db.patch(profile._id, {
            ...(args.name !== undefined ? { name: formatDisplayName(args.name) } : {}),
            ...(args.avatar !== undefined ? { avatar: args.avatar } : {}),
        })
        return profile._id
    },
})
