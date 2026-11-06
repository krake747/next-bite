import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api } from "@convex/_generated/api"
import { type DataModel, type Id } from "@convex/_generated/dataModel"
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

async function createRestaurant(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"restaurants">> {
    return asUser(t, subject).action(api.restaurants.addWithOpeningHours, {
        name: "Trattoria Verde",
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
    })
}

describe("restaurant getById", () => {
    test("returns the record to its owner", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")

        const found = await asUser(t, "anna").query(api.restaurants.getById, { id: restaurantId })

        expect(found?.name).toBe("Trattoria Verde")
    })

    test("returns the record to a shared user", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const restaurantId = await createRestaurant(t, "anna")
        await asUser(t, "anna").mutation(api.shares.shareWithUser, { restaurantId, userId: "ben" })

        const found = await asUser(t, "ben").query(api.restaurants.getById, { id: restaurantId })

        expect(found?.name).toBe("Trattoria Verde")
    })

    test("returns the record to a group member", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        await asUser(t, "anna").mutation(api.groups.addMember, { groupId, userId: "ben" })
        const restaurantId = await createRestaurant(t, "anna")
        await asUser(t, "anna").mutation(api.shares.shareWithGroup, { restaurantId, groupId })

        const found = await asUser(t, "ben").query(api.restaurants.getById, { id: restaurantId })

        expect(found?.name).toBe("Trattoria Verde")
    })

    test("returns null to strangers", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "cas")
        const restaurantId = await createRestaurant(t, "anna")

        const found = await asUser(t, "cas").query(api.restaurants.getById, { id: restaurantId })

        expect(found).toBeNull()
    })

    test("returns null without authentication", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")

        const found = await t.query(api.restaurants.getById, { id: restaurantId })

        expect(found).toBeNull()
    })
})
