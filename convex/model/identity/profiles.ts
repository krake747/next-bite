import { type GenericDatabaseReader } from "convex/server"

import { FALLBACK_DISPLAY_NAME } from "../../../src/core/constants"
import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"
import { type QueryCtx } from "../../_generated/server"

type ProfileDb = GenericDatabaseReader<DataModel>
type ProfileCtx = Pick<QueryCtx, "auth" | "db">

export type ProfileSummary = {
    readonly name: string
}

export async function profileByAuthUser(db: ProfileDb, authUserId: string): Promise<Doc<"profiles"> | null> {
    return db
        .query("profiles")
        .withIndex("by_auth_user", (q) => q.eq("authUserId", authUserId))
        .unique()
}

export async function profileByEmail(db: ProfileDb, email: string): Promise<Doc<"profiles"> | null> {
    const address = email.trim()
    const exact = await db
        .query("profiles")
        .withIndex("by_email", (q) => q.eq("email", address))
        .unique()
    if (exact !== null) {
        return exact
    }
    return db
        .query("profiles")
        .withIndex("by_email", (q) => q.eq("email", address.toLowerCase()))
        .unique()
}

export async function signedInProfile(ctx: ProfileCtx): Promise<Doc<"profiles"> | null> {
    const identity = await ctx.auth.getUserIdentity()
    if (identity === null) {
        throw new Error("Unauthorized: authentication required")
    }
    return profileByAuthUser(ctx.db, identity.subject)
}

export async function viewerProfile(ctx: ProfileCtx): Promise<Doc<"profiles"> | null> {
    const identity = await ctx.auth.getUserIdentity()
    return identity === null ? null : profileByAuthUser(ctx.db, identity.subject)
}

export async function requireProfile(ctx: ProfileCtx): Promise<Doc<"profiles">> {
    const profile = await signedInProfile(ctx)
    if (profile === null) {
        throw new Error("Unauthorized: profile required")
    }
    return profile
}

export async function getProfiles(
    db: ProfileDb,
    ids: ReadonlyArray<Id<"profiles">>,
): Promise<ReadonlyMap<Id<"profiles">, ProfileSummary>> {
    const unique = [...new Set(ids)]
    const profiles = await Promise.all(unique.map(async (id) => db.get("profiles", id)))
    return new Map(unique.map((id, index) => [id, { name: profiles[index]?.name ?? FALLBACK_DISPLAY_NAME }]))
}

export function nameOf(profiles: ReadonlyMap<Id<"profiles">, ProfileSummary>, id: Id<"profiles">): string {
    return profiles.get(id)?.name ?? FALLBACK_DISPLAY_NAME
}
