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

describe("landing stats", () => {
    test("serves aggregate-only stats without authentication", async () => {
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

    test("tracks writes through the counters", async () => {
        const t = setup()
        await asUser(t, "anna").mutation(api.users.ensureProfile, { email: "anna@example.com", name: "anna" })
        const firstId = await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
        })
        await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Sushi Bar",
            cuisine: "Japanese",
            addressLabel: "Luxembourg City",
        })

        await asUser(t, "anna").mutation(api.social.toggleInterest, { restaurantId: firstId, status: "want" })
        const wanted = await t.query(api.landing.getStats, {})
        expect(wanted.totalRestaurants).toBe(2)
        expect(wanted.totalWants).toBe(1)

        await asUser(t, "anna").mutation(api.social.toggleInterest, { restaurantId: firstId, status: "want" })
        const unwanted = await t.query(api.landing.getStats, {})
        expect(unwanted.totalWants).toBe(0)

        await asUser(t, "anna").mutation(api.restaurants.update, { id: firstId, cuisine: "French" })
        const renamed = await t.query(api.landing.getStats, {})
        expect(renamed.topCuisines).toContainEqual({ cuisine: "French", count: 1 })
        expect(renamed.topCuisines).not.toContainEqual({ cuisine: "Italian", count: 1 })

        await asUser(t, "anna").mutation(api.restaurants.remove, { id: firstId })
        const afterRemove = await t.query(api.landing.getStats, {})
        expect(afterRemove.totalRestaurants).toBe(1)
        expect(afterRemove.topCuisines).toEqual([{ cuisine: "Japanese", count: 1 }])
    })
})
