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
    await asUser(t, subject).mutation(api.identity.ensureProfile, { email, name: subject })
}

describe("reusable group invitation links", () => {
    test("admits multiple holders without consuming the link", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invites.create, {
            target: { kind: "group", groupId },
        })

        await expect(asUser(t, "ben").mutation(api.invites.accept, { token })).resolves.toEqual({
            result: "accepted",
            groupId,
        })
        await expect(asUser(t, "cas").mutation(api.invites.accept, { token })).resolves.toEqual({
            result: "accepted",
            groupId,
        })
        await expect(asUser(t, "ben").mutation(api.invites.accept, { token })).resolves.toEqual({
            result: "alreadyMember",
            groupId,
        })

        const benGroups = await asUser(t, "ben").query(api.groups.list, {})
        expect(benGroups).toHaveLength(1)
        const casGroups = await asUser(t, "cas").query(api.groups.list, {})
        expect(casGroups).toHaveLength(1)
    })

    test("revocation deletes the link so new accepts read as not found", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invites.create, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.invites.accept, { token })
        await expect(asUser(t, "anna").mutation(api.invites.revoke, { token })).resolves.toEqual({
            result: "revoked",
        })

        await expect(asUser(t, "cas").mutation(api.invites.accept, { token })).rejects.toThrow("not found")
        await expect(t.query(api.invites.get, { token, now: Date.now() })).rejects.toThrow("not found")
        await expect(asUser(t, "anna").mutation(api.invites.revoke, { token })).rejects.toThrow("not found")

        const benGroups = await asUser(t, "ben").query(api.groups.list, {})
        expect(benGroups).toHaveLength(1)
    })

    test("only the inviter or the group owner can revoke", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invites.create, {
            target: { kind: "group", groupId },
        })
        await expect(asUser(t, "cas").mutation(api.invites.revoke, { token })).rejects.toThrow("Unauthorized")
        await asUser(t, "ben").mutation(api.invites.accept, { token })
        await expect(asUser(t, "ben").mutation(api.invites.revoke, { token })).rejects.toThrow("Unauthorized")
    })

    test("loses validity when the inviter leaves", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })

        const annaToken = await asUser(t, "anna").mutation(api.invites.create, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.invites.accept, { token: annaToken })

        const benToken = await asUser(t, "ben").mutation(api.invites.create, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.groups.leave, { groupId })

        await expect(asUser(t, "cas").mutation(api.invites.accept, { token: benToken })).rejects.toThrow(
            "no longer valid",
        )
    })

    test("rejects expired links on preview and accept", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invites.create, {
            target: { kind: "group", groupId },
        })
        vi.useFakeTimers()
        try {
            vi.setSystemTime(Date.now() + 8 * 24 * 60 * 60 * 1000)
            await expect(t.query(api.invites.get, { token, now: Date.now() })).rejects.toThrow("expired")
            await expect(asUser(t, "ben").mutation(api.invites.accept, { token })).rejects.toThrow("expired")
        } finally {
            vi.useRealTimers()
        }
    })
})
