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

async function registerUser(t: TestConvexForDataModel<DataModel>, subject: string): Promise<void> {
    await asUser(t, subject).mutation(api.users.ensureProfile, { email: `${subject}@example.com`, name: subject })
}

describe("leaving a group", () => {
    test("lets a member leave and keeps the owner in", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        const token = await asUser(t, "anna").mutation(api.invitations.createInvite, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })

        await asUser(t, "ben").mutation(api.groups.leaveGroup, { groupId })

        expect(await asUser(t, "ben").query(api.groups.getGroup, { groupId })).toBeNull()
        await expect(asUser(t, "anna").mutation(api.groups.leaveGroup, { groupId })).rejects.toThrow(
            "owner cannot leave",
        )
        const view = await asUser(t, "anna").query(api.groups.getGroup, { groupId })
        expect(view?.isOwner).toBe(true)
        expect(view?.members.map((m) => m.userId)).toEqual(["anna"])
    })
})
