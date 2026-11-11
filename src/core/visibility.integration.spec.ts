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

async function createPlace(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    name = "Trattoria Verde",
): Promise<Id<"places">> {
    return asUser(t, subject).mutation(api.places.create, {
        name,
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
        photos: [],
    })
}

async function profileId(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"profiles">> {
    const me = await asUser(t, subject).query(api.identity.me, {})
    if (me.status !== "ready") {
        throw new Error(`No profile for ${subject}`)
    }
    return me.profile._id
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

describe("place visibility", () => {
    test("a friend sees the place without any group", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const placeId = await createPlace(t, "anna")
        await befriend(t, "anna", "ben")

        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).not.toBeNull()
    })

    test("a stranger sees nothing and cannot save", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "cas")
        const placeId = await createPlace(t, "anna")

        expect(await asUser(t, "cas").query(api.places.get, { id: placeId })).toBeNull()
        await expect(asUser(t, "cas").mutation(api.places.setSave, { placeId, status: "want" })).rejects.toThrow(
            "not visible",
        )
    })

    test("unfriending revokes access at once", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const placeId = await createPlace(t, "anna")
        await befriend(t, "anna", "ben")
        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).not.toBeNull()

        await asUser(t, "anna").mutation(api.social.remove, { friendId: await profileId(t, "ben") })

        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).toBeNull()
        expect(await asUser(t, "anna").query(api.places.get, { id: placeId })).not.toBeNull()
    })

    test("a group member sees a group-held place and loses it after leaving", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await registerUser(t, "cas")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        await joinGroup(t, groupId, "anna", "ben")
        const placeId = await createPlace(t, "anna")
        await asUser(t, "anna").mutation(api.places.addToGroup, { groupId, placeId })

        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).not.toBeNull()
        expect(await asUser(t, "cas").query(api.places.get, { id: placeId })).toBeNull()

        await asUser(t, "ben").mutation(api.groups.leave, { groupId })
        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).toBeNull()
    })

    test("only members write group links", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "cas")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        const placeId = await createPlace(t, "anna")

        await expect(asUser(t, "cas").mutation(api.places.addToGroup, { groupId, placeId })).rejects.toThrow(
            "membership required",
        )
        await expect(asUser(t, "cas").mutation(api.places.removeFromGroup, { groupId, placeId })).rejects.toThrow(
            "membership required",
        )
    })
})
