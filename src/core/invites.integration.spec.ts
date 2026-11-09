import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api } from "@convex/_generated/api"
import { type DataModel } from "@convex/_generated/dataModel"
import schema from "@convex/schema"

vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site")

const modules = import.meta.glob("../../convex/**/*.ts")

function setup(): TestConvexForDataModel<DataModel> {
    // oxlint-disable-next-line typescript/no-unsafe-assignment -- convex-test factory is untyped at the module-glob boundary; the annotation restores safety for all callers
    return convexTest(schema, modules)
}

function asUser(t: TestConvexForDataModel<DataModel>, subject: string): TestConvexForDataModel<DataModel> {
    return t.withIdentity({ subject })
}

async function registerUser(t: TestConvexForDataModel<DataModel>, subject: string, email: string): Promise<void> {
    await asUser(t, subject).mutation(api.users.ensureProfile, { email, name: subject })
}

describe("reusable group invitation links", () => {
    test("admits multiple holders without consuming the link", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invitations.createInvite, {
            target: { kind: "group", groupId },
        })

        await expect(asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })).resolves.toEqual({
            result: "accepted",
            groupId,
        })
        await expect(asUser(t, "cas").mutation(api.invitations.acceptInvite, { token })).resolves.toEqual({
            result: "accepted",
            groupId,
        })
        await expect(asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })).resolves.toEqual({
            result: "alreadyMember",
            groupId,
        })

        const benGroups = await asUser(t, "ben").query(api.groups.listMyGroups, {})
        expect(benGroups).toHaveLength(1)
        const casGroups = await asUser(t, "cas").query(api.groups.listMyGroups, {})
        expect(casGroups).toHaveLength(1)
    })

    test("revocation stops new accepts but keeps existing members", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invitations.createInvite, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })
        await asUser(t, "anna").mutation(api.invitations.revokeInvite, { token })

        await expect(asUser(t, "cas").mutation(api.invitations.acceptInvite, { token })).rejects.toThrow("revoked")
        await expect(t.query(api.invitations.getInvite, { token, now: Date.now() })).rejects.toThrow("revoked")

        const benGroups = await asUser(t, "ben").query(api.groups.listMyGroups, {})
        expect(benGroups).toHaveLength(1)
    })

    test("only the inviter or a group admin can revoke", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invitations.createInvite, {
            target: { kind: "group", groupId },
        })
        await expect(asUser(t, "cas").mutation(api.invitations.revokeInvite, { token })).rejects.toThrow("Unauthorized")
        await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })
        await expect(asUser(t, "ben").mutation(api.invitations.revokeInvite, { token })).rejects.toThrow("Unauthorized")
    })

    test("loses validity when the inviter leaves", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })

        const annaToken = await asUser(t, "anna").mutation(api.invitations.createInvite, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token: annaToken })

        const benToken = await asUser(t, "ben").mutation(api.invitations.createInvite, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.groups.removeMember, { groupId, userId: "ben" })

        await expect(asUser(t, "cas").mutation(api.invitations.acceptInvite, { token: benToken })).rejects.toThrow(
            "no longer valid",
        )
    })

    test("rejects expired links on preview and accept", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invitations.createInvite, {
            target: { kind: "group", groupId },
        })
        vi.useFakeTimers()
        try {
            vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000)
            await expect(t.query(api.invitations.getInvite, { token, now: Date.now() })).rejects.toThrow("expired")
            await expect(asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })).rejects.toThrow("expired")
        } finally {
            vi.useRealTimers()
        }
    })
})
