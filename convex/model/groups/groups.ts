import { type GenericDatabaseReader, type GenericDatabaseWriter } from "convex/server"
import { v } from "convex/values"

import { type DataModel, type Id } from "../../_generated/dataModel"
import { getProfiles, nameOf } from "../identity/profiles"
import { MEMBER_LIMIT, memberGroupIds, requireMember } from "./memberships"
import { groupsTables } from "./schema"

export const groupValidator = v.object({
    _id: v.id("groups"),
    _creationTime: v.number(),
    ...groupsTables.groups.validator.fields,
})

export const groupMemberValidator = v.object({
    userId: v.id("profiles"),
    name: v.string(),
    isOwner: v.boolean(),
})

export const groupListEntryValidator = v.object({
    group: groupValidator,
    isOwner: v.boolean(),
})

export const groupViewValidator = v.object({
    group: groupValidator,
    isOwner: v.boolean(),
    members: v.array(groupMemberValidator),
})

export async function createGroupRecord(
    db: GenericDatabaseWriter<DataModel>,
    ownerId: Id<"profiles">,
    name: string,
): Promise<Id<"groups">> {
    const trimmed = name.trim()
    if (trimmed === "" || trimmed.length > 80) {
        throw new Error("Group name must be 1-80 characters")
    }
    const groupId = await db.insert("groups", { ownerId, name: trimmed })
    await db.insert("groupMembers", { groupId, userId: ownerId })
    return groupId
}

export async function leaveGroupRecord(
    db: GenericDatabaseWriter<DataModel>,
    userId: Id<"profiles">,
    groupId: Id<"groups">,
): Promise<Id<"groupMembers">> {
    const group = await db.get("groups", groupId)
    if (group === null) {
        throw new Error("Group not found")
    }
    if (userId === group.ownerId) {
        throw new Error("The group owner cannot leave")
    }
    const membership = await requireMember(db, groupId, userId)
    await db.delete("groupMembers", membership._id)
    return membership._id
}

export async function groupOwnerId(
    db: GenericDatabaseReader<DataModel>,
    groupId: Id<"groups">,
): Promise<Id<"profiles"> | null> {
    const group = await db.get("groups", groupId)
    return group?.ownerId ?? null
}

export async function listGroups(db: GenericDatabaseReader<DataModel>, userId: Id<"profiles">, limit: number) {
    const groupIds = await memberGroupIds(db, userId, limit)
    const groups = await Promise.all(groupIds.map(async (groupId) => db.get("groups", groupId)))
    return groups.flatMap((group) => (group === null ? [] : [{ group, isOwner: group.ownerId === userId }]))
}

export async function getGroupView(
    db: GenericDatabaseReader<DataModel>,
    userId: Id<"profiles">,
    groupId: Id<"groups">,
) {
    const group = await db.get("groups", groupId)
    if (group === null) {
        return null
    }
    const membership = await db
        .query("groupMembers")
        .withIndex("by_group_user", (q) => q.eq("groupId", groupId).eq("userId", userId))
        .unique()
    if (membership === null) {
        return null
    }
    const members = await db
        .query("groupMembers")
        .withIndex("by_group", (q) => q.eq("groupId", groupId))
        .take(MEMBER_LIMIT)
    const names = await getProfiles(
        db,
        members.map((member) => member.userId),
    )
    return {
        group,
        isOwner: group.ownerId === userId,
        members: members.map((member) => ({
            userId: member.userId,
            name: nameOf(names, member.userId),
            isOwner: member.userId === group.ownerId,
        })),
    }
}
