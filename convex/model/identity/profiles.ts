import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"
import { v } from "convex/values"

import { FALLBACK_DISPLAY_NAME } from "../../../src/core/constants"
import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"
import { type QueryCtx } from "../../_generated/server"
import { identityTables } from "./schema"

type ProfileDb = GenericDatabaseReader<DataModel>
type ProfileWriter = GenericDatabaseWriter<DataModel>
type ProfileCtx = Pick<QueryCtx, "auth" | "db">

export const profileValidator = v.object({
    _id: v.id("profiles"),
    _creationTime: v.number(),
    ...identityTables.profiles.validator.fields,
})

export const profileSummaryValidator = v.object({
    profileId: v.id("profiles"),
    name: v.string(),
})

export function formatDisplayName(raw: string | null | undefined, fallbackEmail?: string): string {
    const trimmed = (raw ?? fallbackEmail ?? "").trim().slice(0, 60)
    return trimmed === "" ? FALLBACK_DISPLAY_NAME : trimmed
}

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

export async function createProfile(
    db: ProfileWriter,
    authUserId: string,
    name: string,
    email: string,
): Promise<Id<"profiles">> {
    return db.insert("profiles", { authUserId, name: formatDisplayName(name), email: email.trim().toLowerCase() })
}

export async function renameProfile(db: ProfileWriter, profileId: Id<"profiles">, name: string): Promise<void> {
    await db.patch("profiles", profileId, { name: formatDisplayName(name) })
}

export type AvatarRecord = NonNullable<Doc<"profiles">["avatar"]>

export async function avatarHolder(db: ProfileDb, storageId: Id<"_storage">): Promise<Doc<"profiles"> | null> {
    return db
        .query("profiles")
        .withIndex("by_avatar_storage", (q) => q.eq("avatar.storageId", storageId))
        .first()
}

export async function setProfileAvatar(
    db: ProfileWriter,
    profileId: Id<"profiles">,
    avatar: AvatarRecord,
): Promise<void> {
    await db.patch("profiles", profileId, { avatar })
}

export async function clearProfileAvatar(db: ProfileWriter, profileId: Id<"profiles">): Promise<void> {
    await db.patch("profiles", profileId, { avatar: undefined })
}
