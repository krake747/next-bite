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

async function registerUser(t: TestConvexForDataModel<DataModel>, subject: string, email: string): Promise<void> {
    await asUser(t, subject).mutation(api.identity.ensureProfile, { email, name: subject })
}

async function idOf(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"profiles">> {
    const me = await asUser(t, subject).query(api.identity.me, {})
    if (me.status !== "ready") {
        throw new Error(`No profile for ${subject}`)
    }
    return me.profile._id
}

async function befriend(t: TestConvexForDataModel<DataModel>, a: string, b: string): Promise<void> {
    const token = await asUser(t, a).mutation(api.invites.create, { target: { kind: "friend" } })
    await asUser(t, b).mutation(api.invites.accept, { token })
}

async function createRestaurant(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"restaurants">> {
    return asUser(t, subject).action(api.restaurants.addWithOpeningHours, {
        name: "Trattoria Verde",
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
    })
}

describe("bounded meal planning", () => {
    test("group members can create and list plans with participants", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        const token = await asUser(t, "anna").mutation(api.invites.create, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.invites.accept, { token })

        const planId = await asUser(t, "anna").mutation(api.plans.createPlan, {
            groupId,
            title: "Friday dinner",
            date: Date.now() + 86400000,
            participantIds: [await idOf(t, "ben")],
        })
        expect(planId).toBeDefined()

        const plans = await asUser(t, "ben").query(api.plans.listPlansForGroup, { groupId })
        expect(plans).toHaveLength(1)
        expect(plans[0]?.title).toBe("Friday dinner")
        expect(plans[0]?.participants.map((p) => p.userId).toSorted()).toEqual(
            [await idOf(t, "anna"), await idOf(t, "ben")].toSorted(),
        )
    })

    test("non-members cannot create or read group plans", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })

        await expect(
            asUser(t, "cas").mutation(api.plans.createPlan, {
                groupId,
                title: "Sneaky dinner",
                date: Date.now() + 86400000,
            }),
        ).rejects.toThrow("membership")
        await expect(asUser(t, "cas").query(api.plans.listPlansForGroup, { groupId })).rejects.toThrow("membership")
    })

    test("restaurant plans respect visibility and friendship", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await expect(
            asUser(t, "cas").mutation(api.plans.createPlan, {
                restaurantId,
                title: "Sneaky dinner",
                date: Date.now() + 86400000,
            }),
        ).rejects.toThrow("not shared")

        const friendToken = await asUser(t, "anna").mutation(api.invites.create, {
            target: { kind: "friend" },
        })
        await asUser(t, "ben").mutation(api.invites.accept, { token: friendToken })

        const planId = await asUser(t, "anna").mutation(api.plans.createPlan, {
            restaurantId,
            title: "Catch-up dinner",
            date: Date.now() + 86400000,
            participantIds: [await idOf(t, "ben")],
        })
        expect(planId).toBeDefined()

        await expect(
            asUser(t, "anna").mutation(api.plans.createPlan, {
                restaurantId,
                title: "Stranger dinner",
                date: Date.now() + 86400000,
                participantIds: [await idOf(t, "cas")],
            }),
        ).rejects.toThrow("friend")

        await expect(asUser(t, "cas").query(api.plans.listPlansForRestaurant, { restaurantId })).rejects.toThrow(
            "not shared",
        )
    })

    test("hides group-scoped plans from restaurant viewers outside the group", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const restaurantId = await createRestaurant(t, "anna")
        await befriend(t, "anna", "cas")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        await asUser(t, "anna").mutation(api.plans.createPlan, {
            groupId,
            restaurantId,
            title: "Crew dinner",
            date: Date.now() + 86400000,
        })

        const visible = await asUser(t, "cas").query(api.plans.listPlansForRestaurant, { restaurantId })
        expect(visible).toEqual([])
    })

    test("only the organizer or a group admin can update status", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        const token = await asUser(t, "anna").mutation(api.invites.create, {
            target: { kind: "group", groupId },
        })
        await asUser(t, "ben").mutation(api.invites.accept, { token })
        await asUser(t, "cas").mutation(api.invites.accept, { token })

        const planId = await asUser(t, "ben").mutation(api.plans.createPlan, {
            groupId,
            title: "Friday dinner",
            date: Date.now() + 86400000,
        })

        await expect(asUser(t, "cas").mutation(api.plans.updatePlanStatus, { planId, status: "done" })).rejects.toThrow(
            "Unauthorized",
        )
        await expect(asUser(t, "ben").mutation(api.plans.updatePlanStatus, { planId, status: "done" })).resolves.toBe(
            planId,
        )
        await expect(
            asUser(t, "anna").mutation(api.plans.updatePlanStatus, { planId, status: "cancelled" }),
        ).resolves.toBe(planId)
    })
})
