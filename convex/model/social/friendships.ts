import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"

import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"

type SocialDb = GenericDatabaseReader<DataModel>
type SocialWriter = GenericDatabaseWriter<DataModel>
type ProfileId = Id<"profiles">

export const FRIEND_LIMIT = 200
export const REQUEST_LIMIT = 50

export type RequestOutcome = "pending" | "accepted"

async function pairRow(db: SocialDb, userId: ProfileId, friendId: ProfileId): Promise<Doc<"friendships"> | null> {
    return db
        .query("friendships")
        .withIndex("by_pair", (q) => q.eq("userId", userId).eq("friendId", friendId))
        .unique()
}

async function upsertAccepted(db: SocialWriter, userId: ProfileId, friendId: ProfileId): Promise<void> {
    const row = await pairRow(db, userId, friendId)
    if (row === null) {
        await db.insert("friendships", { userId, friendId, status: "accepted" })
        return
    }
    if (row.status !== "accepted") {
        await db.patch("friendships", row._id, { status: "accepted" })
    }
}

async function deleteRow(db: SocialWriter, userId: ProfileId, friendId: ProfileId): Promise<void> {
    const row = await pairRow(db, userId, friendId)
    if (row !== null) {
        await db.delete("friendships", row._id)
    }
}

function assertNotSelf(me: ProfileId, friendId: ProfileId): void {
    if (me === friendId) {
        throw new Error("You cannot befriend yourself")
    }
}

export async function areFriends(db: SocialDb, a: ProfileId, b: ProfileId): Promise<boolean> {
    return (await pairRow(db, a, b))?.status === "accepted"
}

export async function friendIds(db: SocialDb, me: ProfileId, limit: number): Promise<ProfileId[]> {
    const rows = await db
        .query("friendships")
        .withIndex("by_user_status", (q) => q.eq("userId", me).eq("status", "accepted"))
        .take(limit)
    return rows.map((row) => row.friendId)
}

export async function incomingRequestIds(db: SocialDb, me: ProfileId, limit: number): Promise<ProfileId[]> {
    const rows = await db
        .query("friendships")
        .withIndex("by_friend_status", (q) => q.eq("friendId", me).eq("status", "pending"))
        .take(limit)
    return rows.map((row) => row.userId)
}

export async function outgoingRequestIds(db: SocialDb, me: ProfileId, limit: number): Promise<ProfileId[]> {
    const rows = await db
        .query("friendships")
        .withIndex("by_user_status", (q) => q.eq("userId", me).eq("status", "pending"))
        .take(limit)
    return rows.map((row) => row.friendId)
}

export async function befriend(db: SocialWriter, a: ProfileId, b: ProfileId): Promise<void> {
    assertNotSelf(a, b)
    await upsertAccepted(db, a, b)
    await upsertAccepted(db, b, a)
}

export async function requestFriendship(db: SocialWriter, me: ProfileId, friendId: ProfileId): Promise<RequestOutcome> {
    assertNotSelf(me, friendId)
    const incoming = await pairRow(db, friendId, me)
    if (incoming !== null) {
        await befriend(db, me, friendId)
        return "accepted"
    }
    const outgoing = await pairRow(db, me, friendId)
    if (outgoing !== null) {
        return outgoing.status
    }
    await db.insert("friendships", { userId: me, friendId, status: "pending" })
    return "pending"
}

export async function acceptFriendship(db: SocialWriter, me: ProfileId, friendId: ProfileId): Promise<void> {
    const incoming = await pairRow(db, friendId, me)
    if (incoming === null) {
        throw new Error("No pending friend request")
    }
    await befriend(db, me, friendId)
}

export async function endFriendship(db: SocialWriter, a: ProfileId, b: ProfileId): Promise<void> {
    await deleteRow(db, a, b)
    await deleteRow(db, b, a)
}
