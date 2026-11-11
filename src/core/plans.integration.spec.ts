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

async function createPlace(t: TestConvexForDataModel<DataModel>, subject: string, name: string): Promise<Id<"places">> {
    return asUser(t, subject).mutation(api.places.create, {
        name,
        addressLabel: "Luxembourg City",
        photos: [],
    })
}

async function createGroup(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"groups">> {
    return asUser(t, subject).mutation(api.groups.create, { name: "Food Crew" })
}

async function joinGroup(
    t: TestConvexForDataModel<DataModel>,
    groupId: Id<"groups">,
    owner: string,
    subject: string,
): Promise<void> {
    const token = await asUser(t, owner).mutation(api.invites.create, { target: { kind: "group", groupId } })
    await asUser(t, subject).mutation(api.invites.accept, { token })
}

async function addToGroup(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    groupId: Id<"groups">,
    placeId: Id<"places">,
): Promise<void> {
    await asUser(t, subject).mutation(api.places.addToGroup, { groupId, placeId })
}

function nextWeek(): number {
    return Date.now() + 7 * 24 * 60 * 60 * 1000
}

describe("group plans", () => {
    test("a member plans a meal at a group place and the group sees it", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const groupId = await createGroup(t, "anna")
        await joinGroup(t, groupId, "anna", "ben")
        const placeId = await createPlace(t, "anna", "Trattoria Verde")
        await addToGroup(t, "anna", groupId, placeId)

        const planId = await asUser(t, "ben").mutation(api.plans.create, {
            groupId,
            placeId,
            startsAt: nextWeek(),
        })
        expect(planId).toBeDefined()

        const plans = await asUser(t, "anna").query(api.plans.forGroup, { groupId })
        expect(plans).toHaveLength(1)
        expect(plans[0]).toMatchObject({
            placeId,
            placeName: "Trattoria Verde",
            status: "planned",
            createdBy: await idOf(t, "ben"),
            organizerName: "ben",
        })
    })

    test("plans survive the organizer leaving while strangers see nothing", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await createGroup(t, "anna")
        await joinGroup(t, groupId, "anna", "ben")
        const placeId = await createPlace(t, "anna", "Trattoria Verde")
        await addToGroup(t, "anna", groupId, placeId)
        await asUser(t, "ben").mutation(api.plans.create, { groupId, placeId, startsAt: nextWeek() })

        await asUser(t, "ben").mutation(api.groups.leave, { groupId })
        await expect(asUser(t, "ben").query(api.plans.forGroup, { groupId })).rejects.toThrow("membership")
        await expect(asUser(t, "cas").query(api.plans.forGroup, { groupId })).rejects.toThrow("membership")

        const plans = await asUser(t, "anna").query(api.plans.forGroup, { groupId })
        expect(plans).toHaveLength(1)
    })

    test("creation needs membership and a group-held place", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await createGroup(t, "anna")
        const placeId = await createPlace(t, "anna", "Trattoria Verde")

        await expect(
            asUser(t, "cas").mutation(api.plans.create, { groupId, placeId, startsAt: nextWeek() }),
        ).rejects.toThrow("membership")
        await expect(
            asUser(t, "anna").mutation(api.plans.create, { groupId, placeId, startsAt: nextWeek() }),
        ).rejects.toThrow("not in this group")
        await expect(
            asUser(t, "anna").mutation(api.plans.create, { groupId, placeId, startsAt: Number.NaN }),
        ).rejects.toThrow("Plan time is required")
    })

    test("organizer or group owner cancels, members cannot", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await createGroup(t, "anna")
        await joinGroup(t, groupId, "anna", "ben")
        await joinGroup(t, groupId, "anna", "cas")
        const placeId = await createPlace(t, "anna", "Trattoria Verde")
        await addToGroup(t, "anna", groupId, placeId)

        const planId = await asUser(t, "ben").mutation(api.plans.create, { groupId, placeId, startsAt: nextWeek() })
        await expect(asUser(t, "cas").mutation(api.plans.cancel, { planId })).rejects.toThrow("Unauthorized")

        await asUser(t, "anna").mutation(api.plans.cancel, { planId })
        expect(await asUser(t, "anna").query(api.plans.forGroup, { groupId })).toMatchObject([{ status: "cancelled" }])

        const second = await asUser(t, "ben").mutation(api.plans.create, { groupId, placeId, startsAt: nextWeek() })
        await expect(asUser(t, "ben").mutation(api.plans.cancel, { planId: second })).resolves.toBe(second)
        expect(await asUser(t, "anna").query(api.plans.forGroup, { groupId })).toHaveLength(2)
    })

    test("plans sort by start time", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        const groupId = await createGroup(t, "anna")
        const first = await createPlace(t, "anna", "Earlier")
        const second = await createPlace(t, "anna", "Later")
        await addToGroup(t, "anna", groupId, first)
        await addToGroup(t, "anna", groupId, second)

        await asUser(t, "anna").mutation(api.plans.create, { groupId, placeId: second, startsAt: nextWeek() + 1000 })
        await asUser(t, "anna").mutation(api.plans.create, { groupId, placeId: first, startsAt: nextWeek() })

        const plans = await asUser(t, "anna").query(api.plans.forGroup, { groupId })
        expect(plans.map((plan) => plan.placeName)).toEqual(["Earlier", "Later"])
    })
})
