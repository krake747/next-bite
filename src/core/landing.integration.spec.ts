import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, it, vi } from "vitest"

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

describe("landing stats", () => {
    it("serves aggregate-only stats without authentication", async () => {
        const t = setup()
        await asUser(t, "anna").mutation(api.users.ensureProfile, { email: "anna@example.com", name: "anna" })
        await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
        })
        await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Sushi Bar",
            cuisine: "Japanese",
            addressLabel: "Luxembourg City",
        })

        const stats = await t.query(api.landing.getStats, {})

        expect(stats.totalRestaurants).toBe(2)
        expect(stats.topCuisines).toHaveLength(2)
        expect(stats.recentAdds).toHaveLength(2)
        expect(JSON.stringify(stats)).not.toContain("anna@example.com")
        expect(JSON.stringify(stats)).not.toContain("Luxembourg City")
        for (const recent of stats.recentAdds) {
            expect(Object.keys(recent).toSorted()).toEqual(["createdAt", "cuisine", "name"])
        }
    })
})
