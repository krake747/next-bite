import { type GenericDatabaseReader } from "convex/server"

import { type DataModel, type Doc, type Id } from "../../_generated/dataModel"

export const GROUP_LIMIT = 100
export const MEMBER_LIMIT = 200

export async function requireMember(
    db: GenericDatabaseReader<DataModel>,
    groupId: Id<"groups">,
    userId: Id<"profiles">,
): Promise<Doc<"groupMembers">> {
    const group = await db.get("groups", groupId)
    if (group === null) {
        throw new Error("Group not found")
    }
    const membership = await db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
        .unique()
    if (membership === null) {
        throw new Error("Unauthorized: group membership required")
    }
    return membership
}

export async function memberGroupIds(
    db: GenericDatabaseReader<DataModel>,
    viewer: Id<"profiles">,
    limit: number,
): Promise<Id<"groups">[]> {
    const rows = await db
        .query("groupMembers")
        .withIndex("by_user", (q) => q.eq("userId", viewer))
        .take(limit)
    return rows.map((row) => row.groupId)
}
