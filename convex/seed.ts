import { APIError } from "better-auth"

import { type Id } from "./_generated/dataModel"
import { internalMutation, type MutationCtx } from "./_generated/server"
import { createAuth } from "./auth"
import { getValidatedSiteUrl } from "./env"
import { formatDisplayName, profileByEmail } from "./model/identity/profiles"

export const SEED_OWNER_EMAIL = "preview-owner@example.com"
export const SEED_FRIEND_EMAIL = "preview-friend@example.com"
export const SEED_GROUP_NAME = "Preview dinner club"

// Dev-only baseline credential; never create on production.
const SEED_PASSWORD = "preview-baseline-dev-only"

type SeedUser = {
    readonly email: string
    readonly name: string
}

const SEED_OWNER: SeedUser = { email: SEED_OWNER_EMAIL, name: "Preview Owner" }
const SEED_FRIEND: SeedUser = { email: SEED_FRIEND_EMAIL, name: "Preview Friend" }

type SeedRestaurant = {
    readonly slug: string
    readonly name: string
    readonly cuisine: string
    readonly label: string
}

const SEED_RESTAURANTS: ReadonlyArray<SeedRestaurant> = [
    { slug: "midnight-ramen", name: "Midnight Ramen", cuisine: "Japanese", label: "7 Preview Lane, Berlin" },
    { slug: "verde-taqueria", name: "Verde Taqueria", cuisine: "Mexican", label: "12 Preview Lane, Berlin" },
    { slug: "crumb-coffee", name: "Crumb and Coffee", cuisine: "Cafe", label: "3 Preview Lane, Berlin" },
]

function seedMarker(slug: string): string {
    return `seed:${slug}`
}

type ProfileId = Id<"profiles">

async function insertSeedProfile(ctx: MutationCtx, authUserId: string, user: SeedUser): Promise<ProfileId> {
    return ctx.db.insert("profiles", {
        authUserId,
        name: formatDisplayName(user.name),
        email: user.email,
    })
}

// See ADR-0005: users via auth API, profile row marks reruns.
async function ensureSeedUser(ctx: MutationCtx, user: SeedUser): Promise<ProfileId> {
    const existing = await profileByEmail(ctx.db, user.email)
    if (existing) {
        return existing._id
    }
    const auth = createAuth(ctx)
    const headers = new Headers({ origin: getValidatedSiteUrl() })
    try {
        const signedUp = await auth.api.signUpEmail({
            body: { name: user.name, email: user.email, password: SEED_PASSWORD },
            headers,
        })
        return await insertSeedProfile(ctx, signedUp.user.id, user)
    } catch (error) {
        if (!(error instanceof APIError) || error.statusCode !== 422) {
            throw error
        }
        // The auth account exists without an app profile, from a manual
        // sign-up or wiped profiles. Resolve it through sign-in, still
        // through the auth API rather than auth table reads.
        const signedIn = await auth.api.signInEmail({
            body: { email: user.email, password: SEED_PASSWORD },
            headers,
        })
        const retry = await profileByEmail(ctx.db, user.email)
        if (retry) {
            return retry._id
        }
        return insertSeedProfile(ctx, signedIn.user.id, user)
    }
}

// Restaurants are keyed by a seed marker in clientMutationId, so renames in
// the UI do not duplicate them and reruns reuse the same rows.
async function ensureSeedRestaurant(
    ctx: MutationCtx,
    ownerId: ProfileId,
    place: SeedRestaurant,
): Promise<Id<"restaurants">> {
    // Single-owner scope; the seed needs at most a handful of rows. Take keeps
    // the read bounded so the scan cannot grow without limit as tables grow.
    const owned = await ctx.db
        .query("restaurants")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .take(1000)
    const match = owned.find((row) => row.clientMutationId === seedMarker(place.slug))
    if (match) {
        return match._id
    }
    const restaurantId = await ctx.db.insert("restaurants", {
        ownerId,
        name: place.name,
        cuisine: place.cuisine,
        address: { label: place.label },
        images: [],
        visibility: "shared",
        clientMutationId: seedMarker(place.slug),
    })
    return restaurantId
}

async function ensureSeedMembership(ctx: MutationCtx, groupId: Id<"groups">, userId: ProfileId): Promise<void> {
    const membership = await ctx.db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
        .unique()
    if (!membership) {
        await ctx.db.insert("groupMembers", { groupId, userId })
    }
}

// The group is keyed by owner plus name. Reruns reuse it and repair missing
// memberships instead of duplicating anything.
async function ensureSeedGroup(ctx: MutationCtx, ownerId: ProfileId, friendId: ProfileId): Promise<Id<"groups">> {
    // Single-owner scope; the seed needs at most one row. Take keeps the read
    // bounded so the scan cannot grow without limit as tables grow.
    const owned = await ctx.db
        .query("groups")
        .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
        .take(1000)
    const match = owned.find((row) => row.name === SEED_GROUP_NAME)
    const groupId = match !== undefined ? match._id : await ctx.db.insert("groups", { ownerId, name: SEED_GROUP_NAME })
    await ensureSeedMembership(ctx, groupId, ownerId)
    await ensureSeedMembership(ctx, groupId, friendId)
    return groupId
}

// Baseline dataset for the shared dev backend (previews and local dev).
// Idempotent: reruns return what already exists and change nothing.
export const previewBaseline = internalMutation({
    args: {},
    handler: async (ctx) => {
        const ownerId = await ensureSeedUser(ctx, SEED_OWNER)
        const friendId = await ensureSeedUser(ctx, SEED_FRIEND)
        const restaurants = []
        for (const place of SEED_RESTAURANTS) {
            restaurants.push({
                slug: place.slug,
                restaurantId: await ensureSeedRestaurant(ctx, ownerId, place),
            })
        }
        const groupId = await ensureSeedGroup(ctx, ownerId, friendId)
        // One small group; the seed needs its handful of memberships. Take
        // keeps the read bounded so the scan cannot grow without limit.
        const members = await ctx.db
            .query("groupMembers")
            .withIndex("by_group", (q) => q.eq("groupId", groupId))
            .take(1000)
        return {
            users: [
                { email: SEED_OWNER_EMAIL, profileId: ownerId },
                { email: SEED_FRIEND_EMAIL, profileId: friendId },
            ],
            restaurants,
            group: {
                name: SEED_GROUP_NAME,
                groupId,
                memberProfileIds: members.map((member) => member.userId).toSorted(),
            },
        }
    },
})
