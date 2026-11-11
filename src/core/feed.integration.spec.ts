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

async function createPlace(t: TestConvexForDataModel<DataModel>, subject: string, name: string): Promise<Id<"places">> {
    return asUser(t, subject).mutation(api.places.create, {
        name,
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
        photos: [],
    })
}

async function feedNames(t: TestConvexForDataModel<DataModel>, subject: string): Promise<string[]> {
    const feed = await asUser(t, subject).query(api.places.feed, {})
    return feed.map((card) => card.name)
}

describe("friends feed", () => {
    test("shows a friend's place without any group", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await befriend(t, "anna", "ben")
        await createPlace(t, "anna", "Trattoria Verde")

        expect(await feedNames(t, "ben")).toContain("Trattoria Verde")
    })

    test("excludes the caller's own places", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await befriend(t, "anna", "ben")
        await createPlace(t, "ben", "Ben's Diner")

        expect(await feedNames(t, "ben")).not.toContain("Ben's Diner")
    })

    test("excludes places from strangers", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await registerUser(t, "cas")
        await befriend(t, "anna", "ben")
        await createPlace(t, "cas", "Cas's Cafe")

        expect(await feedNames(t, "ben")).not.toContain("Cas's Cafe")
    })

    test("merges newest first", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await befriend(t, "anna", "ben")
        await createPlace(t, "anna", "Older")
        await createPlace(t, "anna", "Newer")

        expect(await feedNames(t, "ben")).toEqual(["Newer", "Older"])
    })

    test("caps each friend at ten places and the feed at thirty", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const friends: string[] = []
        for (let index = 0; index < 4; index += 1) {
            const friend = `friend${index}`
            friends.push(friend)
            await registerUser(t, friend)
            await befriend(t, "anna", friend)
        }
        for (const [ownerIndex, friend] of friends.entries()) {
            for (let placeIndex = 0; placeIndex < 12; placeIndex += 1) {
                await createPlace(t, friend, `${ownerIndex}-${placeIndex}`)
            }
        }

        const feed = await asUser(t, "anna").query(api.places.feed, {})
        expect(feed).toHaveLength(30)
        for (const friend of friends) {
            const own = feed.filter((card) => card.ownerName === friend)
            expect(own.length).toBeLessThanOrEqual(10)
        }
    })

    test("returns empty when nothing is shared yet", async () => {
        const t = setup()
        await registerUser(t, "eve")

        expect(await feedNames(t, "eve")).toEqual([])
    })
})
