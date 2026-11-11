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

function asUser(subject: string): TestConvexForDataModel<DataModel> {
    return setup().withIdentity({ subject })
}

describe("identity", () => {
    test("reports no session user for a signed-out request", async () => {
        await expect(setup().query(api.identity.sessionUser, {})).resolves.toBeNull()
    })

    test("creates user details on first ensure and returns the same id on retry", async () => {
        const t = asUser("user-1")
        const first = await t.mutation(api.identity.ensureProfile, { email: "ada@example.com", name: "Ada" })
        const second = await t.mutation(api.identity.ensureProfile, { email: "ada@example.com", name: "Ada" })
        expect(second).toEqual(first)
    })

    test("reports onboarding before user details exist", async () => {
        const t = asUser("user-3")
        await expect(t.query(api.identity.me, {})).resolves.toEqual({ status: "onboarding" })
    })

    test("rejects anonymous callers", async () => {
        const t = setup()
        await expect(t.mutation(api.identity.ensureProfile, { email: "anon@example.com" })).rejects.toThrow(
            "Unauthorized",
        )
        await expect(t.query(api.identity.me, {})).rejects.toThrow("Unauthorized")
    })
})
