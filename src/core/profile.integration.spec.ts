import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, it, vi } from "vitest"

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

async function registerUser(t: TestConvexForDataModel<DataModel>, subject: string, email: string): Promise<void> {
    await asUser(t, subject).mutation(api.users.ensureProfile, { email, name: subject })
}

async function createRestaurant(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"restaurants">> {
    return asUser(t, subject).action(api.restaurants.addWithOpeningHours, {
        name: "Trattoria Verde",
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
    })
}

describe("personal profile and statuses", () => {
    it("reports onboarding without a profile and readiness after", async () => {
        const t = setup()

        expect(await asUser(t, "anna").query(api.users.getMe, {})).toEqual({ status: "onboarding" })

        await registerUser(t, "anna", "anna@example.com")

        expect(await asUser(t, "anna").query(api.users.getMe, {})).toMatchObject({
            status: "ready",
            profile: { email: "anna@example.com" },
        })
    })

    it("updates only the caller's own profile", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")

        await asUser(t, "anna").mutation(api.users.updateMe, { name: "Anna Updated" })

        expect(await asUser(t, "anna").query(api.users.getMe, {})).toMatchObject({
            status: "ready",
            profile: { name: "Anna Updated" },
        })
        expect(await asUser(t, "ben").query(api.users.getMe, {})).toMatchObject({
            status: "ready",
            profile: { name: "ben" },
        })
    })

    it("lists only the caller's want and been statuses", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const restaurantId = await createRestaurant(t, "anna")
        await asUser(t, "anna").mutation(api.shares.shareWithUser, { restaurantId, userId: "ben" })

        await asUser(t, "anna").mutation(api.social.toggleInterest, { restaurantId, status: "want" })
        await asUser(t, "ben").mutation(api.social.toggleInterest, { restaurantId, status: "been" })

        expect(await asUser(t, "anna").query(api.social.listMyStatuses, {})).toEqual([{ restaurantId, status: "want" }])
        expect(await asUser(t, "ben").query(api.social.listMyStatuses, {})).toEqual([{ restaurantId, status: "been" }])
    })
})
