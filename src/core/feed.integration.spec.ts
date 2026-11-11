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
    await asUser(t, subject).mutation(api.identity.ensureProfile, { email: `${subject}@example.com`, name: subject })
}

async function befriend(t: TestConvexForDataModel<DataModel>, a: string, b: string): Promise<void> {
    const token = await asUser(t, a).mutation(api.invites.create, { target: { kind: "friend" } })
    await asUser(t, b).mutation(api.invites.accept, { token })
}

async function createRestaurant(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    name: string,
): Promise<Id<"restaurants">> {
    return asUser(t, subject).action(api.restaurants.addWithOpeningHours, {
        name,
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
    })
}

async function feedNames(t: TestConvexForDataModel<DataModel>, subject: string): Promise<string[]> {
    const feed = await asUser(t, subject).query(api.restaurants.feed, {})
    return feed.map((r) => r.name)
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

describe("friends feed", () => {
    test("shows a friend's restaurant without a share", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await befriend(t, "anna", "ben")
        await createRestaurant(t, "anna", "Trattoria Verde")

        expect(await feedNames(t, "ben")).toContain("Trattoria Verde")
    })

    test("excludes the caller's own restaurants", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await befriend(t, "anna", "ben")
        await createRestaurant(t, "ben", "Ben's Diner")

        expect(await feedNames(t, "ben")).not.toContain("Ben's Diner")
    })

    test("excludes unshared restaurants from strangers", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await registerUser(t, "cas")
        await befriend(t, "anna", "ben")
        await createRestaurant(t, "cas", "Cas's Cafe")

        expect(await feedNames(t, "ben")).not.toContain("Cas's Cafe")
    })

    test("shows a group-shared restaurant from a friend", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await registerUser(t, "dan")
        await befriend(t, "ben", "dan")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        await joinGroup(t, groupId, "anna", "ben")
        await joinGroup(t, groupId, "anna", "dan")
        const restaurantId = await createRestaurant(t, "dan", "Dan's Deli")
        await asUser(t, "dan").mutation(api.shares.shareWithGroup, { restaurantId, groupId })

        expect(await feedNames(t, "ben")).toContain("Dan's Deli")
    })

    test("returns empty when nothing is shared yet", async () => {
        const t = setup()
        await registerUser(t, "eve")

        expect(await feedNames(t, "eve")).toEqual([])
    })
})
