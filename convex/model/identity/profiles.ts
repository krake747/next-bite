import { type GenericDatabaseReader, type GenericDatabaseWriter, type StorageReader } from "convex/server"
import { v, type Infer } from "convex/values"

import { FALLBACK_DISPLAY_NAME } from "../../../src/core/constants"
import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"
import { type QueryCtx } from "../../_generated/server"
import { type imageObjectValidator } from "../../validators"
import { identityTables } from "./schema"

type ProfileDb = GenericDatabaseReader<DataModel>
type ProfileWriter = GenericDatabaseWriter<DataModel>
type ProfileCtx = Pick<QueryCtx, "auth" | "db">
type AvatarCtx = { readonly db: ProfileWriter; readonly storage: StorageReader }

export type AvatarInput = Infer<typeof imageObjectValidator>

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

async function claimAvatarUpload(
    ctx: AvatarCtx,
    profileId: Id<"profiles">,
    avatar: AvatarInput,
): Promise<NonNullable<Doc<"profiles">["avatar"]>> {
    const record = await ctx.db
        .query("uploads")
        .withIndex("by_storage", (q) => q.eq("storageId", avatar.storageId))
        .unique()
    if (record === null || record.ownerId !== profileId) {
        throw new Error("Unauthorized: storage does not belong to you")
    }
    await ctx.db.patch("uploads", record._id, { purpose: "avatar", expiresAt: undefined })
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

export async function setProfileAvatar(ctx: AvatarCtx, profileId: Id<"profiles">, avatar: AvatarInput): Promise<void> {
    const claimed = await claimAvatarUpload(ctx, profileId, avatar)
    await ctx.db.patch("profiles", profileId, { avatar: claimed })
}

export async function clearProfileAvatar(db: ProfileWriter, profileId: Id<"profiles">): Promise<void> {
    await db.patch("profiles", profileId, { avatar: undefined })
}
