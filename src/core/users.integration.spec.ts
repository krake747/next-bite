import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api } from "@convex/_generated/api"
import { type DataModel, type Doc } from "@convex/_generated/dataModel"
import schema from "@convex/schema"

vi.stubEnv("CONVEX_SITE_URL", "https://example.convex.site")

const modules = import.meta.glob("../../convex/**/*.ts")

type MeResult = { status: "ready"; profile: Doc<"profiles"> } | { status: "onboarding" }

function expectReadyProfile(me: MeResult): asserts me is Extract<MeResult, { status: "ready" }> {
    expect(me.status).toBe("ready")
}

function setup(): TestConvexForDataModel<DataModel> {
    // oxlint-disable-next-line typescript/no-unsafe-assignment -- convex-test factory is untyped at the module-glob boundary; the annotation restores safety for all callers
    return convexTest(schema, modules)
}

function asUser(subject: string): TestConvexForDataModel<DataModel> {
    return setup().withIdentity({ subject })
}

describe("users", () => {
    test("creates a profile on first ensure and returns the same id on retry", async () => {
        const t = asUser("user-1")
        const first = await t.mutation(api.users.ensureProfile, { email: "ada@example.com", name: "Ada" })
        const second = await t.mutation(api.users.ensureProfile, { email: "ada@example.com", name: "Ada" })
        expect(second).toEqual(first)
    })

    test("falls back to the email when no name is given and no auth record exists", async () => {
        const t = asUser("user-2")
        const id = await t.mutation(api.users.ensureProfile, { email: "bob@example.com" })
        const me = await t.query(api.users.getMe, {})
        expectReadyProfile(me)
        expect(me.profile._id).toEqual(id)
        expect(me.profile.name).toBe("bob@example.com")
    })

    test("reports onboarding before the profile exists", async () => {
        const t = asUser("user-3")
        await expect(t.query(api.users.getMe, {})).resolves.toEqual({ status: "onboarding" })
    })

    test("updates the name and rejects empty updates", async () => {
        const t = asUser("user-4")
        await expect(t.mutation(api.users.updateMe, {})).rejects.toThrow("Nothing to update")
        await t.mutation(api.users.ensureProfile, { email: "cas@example.com", name: "Cas" })
        await expect(t.mutation(api.users.updateMe, {})).rejects.toThrow("Nothing to update")
        const id = await t.mutation(api.users.updateMe, { name: "  Cassie  " })
        const me = await t.query(api.users.getMe, {})
        expectReadyProfile(me)
        expect(me.profile._id).toEqual(id)
        expect(me.profile.name).toBe("Cassie")
    })

    test("rejects anonymous callers", async () => {
        const t = setup()
        await expect(t.mutation(api.users.ensureProfile, { email: "anon@example.com" })).rejects.toThrow("Unauthorized")
        await expect(t.query(api.users.getMe, {})).rejects.toThrow("Unauthorized")
    })
})
