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

async function storeBlob(t: TestConvexForDataModel<DataModel>, type = "image/jpeg"): Promise<Id<"_storage">> {
    const storageId: unknown = await t.run(async (ctx) => ctx.storage.store(new Blob(["pixels"], { type })))
    if (typeof storageId !== "string") {
        throw new TypeError("Expected storage to return an ID string")
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test storage mints real storage ids; the backend revalidates the table at every boundary
    return storageId as Id<"_storage">
}

async function createPlace(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    name = "Trattoria Verde",
    photoIds: ReadonlyArray<Id<"_storage">> = [],
): Promise<Id<"places">> {
    return asUser(t, subject).mutation(api.places.create, {
        name,
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
        note: "Great terrace",
        photos: photoIds.map((storageId) => ({ storageId })),
    })
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

describe("places.create", () => {
    test("inserts the place and claims its photos in one mutation", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const first = await storeBlob(t)
        const second = await storeBlob(t)

        const placeId = await createPlace(t, "anna", "Trattoria Verde", [first, second])

        const card = await asUser(t, "anna").query(api.places.get, { id: placeId })
        expect(card?.name).toBe("Trattoria Verde")
        expect(card?.ownerName).toBe("anna")
        expect(card?.note).toBe("Great terrace")
        expect(card?.photos.map((photo) => photo.storageId)).toEqual([first, second])
        expect(card?.mySave).toBeNull()
        expect(card?.wantCount).toBe(0)
    })

    test("dedupes retries on the client mutation key", async () => {
        const t = setup()
        await registerUser(t, "anna")

        const first = await asUser(t, "anna").mutation(api.places.create, {
            name: "Trattoria Verde",
            addressLabel: "Luxembourg City",
            photos: [],
            clientMutationId: "anna:key-1",
        })
        const second = await asUser(t, "anna").mutation(api.places.create, {
            name: "Trattoria Verde",
            addressLabel: "Luxembourg City",
            photos: [],
            clientMutationId: "anna:key-1",
        })

        expect(second).toBe(first)
        expect(await asUser(t, "anna").query(api.places.mine, {})).toHaveLength(1)
    })

    test("accepts the legacy mutation key for in-flight older clients", async () => {
        const t = setup()
        await registerUser(t, "anna")

        const first = await asUser(t, "anna").mutation(api.places.create, {
            name: "Trattoria Verde",
            addressLabel: "Luxembourg City",
            photos: [],
            mutationKey: "anna:key-1",
        })
        const second = await asUser(t, "anna").mutation(api.places.create, {
            name: "Trattoria Verde",
            addressLabel: "Luxembourg City",
            photos: [],
            mutationKey: "anna:key-1",
        })

        expect(second).toBe(first)
        expect(await asUser(t, "anna").query(api.places.mine, {})).toHaveLength(1)
    })

    test("rejects non-images, missing blobs, and already claimed storage", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const claimed = await storeBlob(t)
        await createPlace(t, "anna", "First", [claimed])
        const text = await storeBlob(t, "text/plain")
        const missing = await storeBlob(t)
        await t.run(async (ctx) => ctx.storage.delete(missing))

        await expect(createPlace(t, "ben", "Text", [text])).rejects.toThrow("Invalid content type")
        await expect(createPlace(t, "ben", "Gone", [missing])).rejects.toThrow("Upload not found")
        await expect(createPlace(t, "ben", "Taken", [claimed])).rejects.toThrow("already claimed")
    })

    test("rejects a storage id held as an avatar", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const avatar = await storeBlob(t)
        await asUser(t, "anna").mutation(api.identity.setAvatar, { storageId: avatar })

        await expect(createPlace(t, "anna", "Avatar Place", [avatar])).rejects.toThrow("already claimed")
    })

    test("validates the fields", async () => {
        const t = setup()
        await registerUser(t, "anna")

        await expect(
            asUser(t, "anna").mutation(api.places.create, { name: "  ", addressLabel: "Here", photos: [] }),
        ).rejects.toThrow("Name must be 1-120 characters")
    })
})

describe("places.get visibility", () => {
    test("returns the card to its owner", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const placeId = await createPlace(t, "anna")

        expect(await asUser(t, "anna").query(api.places.get, { id: placeId })).toMatchObject({
            name: "Trattoria Verde",
            ownerName: "anna",
        })
    })

    test("returns the card to a friend", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const placeId = await createPlace(t, "anna")
        await befriend(t, "anna", "ben")

        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).not.toBeNull()
    })

    test("returns the card to a member of a group holding the place", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        await joinGroup(t, groupId, "anna", "ben")
        const placeId = await createPlace(t, "anna")
        await asUser(t, "anna").mutation(api.places.addToGroup, { groupId, placeId })

        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).not.toBeNull()
    })

    test("returns null to strangers and rejects signed-out viewers", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "cas")
        const placeId = await createPlace(t, "anna")

        expect(await asUser(t, "cas").query(api.places.get, { id: placeId })).toBeNull()
        await expect(t.query(api.places.get, { id: placeId })).rejects.toThrow("Unauthorized")
    })

    test("loses group visibility after leaving", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        await joinGroup(t, groupId, "anna", "ben")
        const placeId = await createPlace(t, "anna")
        await asUser(t, "anna").mutation(api.places.addToGroup, { groupId, placeId })
        await asUser(t, "ben").mutation(api.groups.leave, { groupId })

        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).toBeNull()
    })
})

describe("places.setSave", () => {
    test("marks want and been and clears back to null", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const placeId = await createPlace(t, "anna")
        await befriend(t, "anna", "ben")

        await asUser(t, "ben").mutation(api.places.setSave, { placeId, status: "want" })
        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).toMatchObject({
            mySave: "want",
            wantCount: 1,
        })

        await asUser(t, "ben").mutation(api.places.setSave, { placeId, status: "been" })
        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).toMatchObject({
            mySave: "been",
            wantCount: 0,
        })

        await asUser(t, "ben").mutation(api.places.setSave, { placeId, status: null })
        expect(await asUser(t, "ben").query(api.places.get, { id: placeId })).toMatchObject({
            mySave: null,
            wantCount: 0,
        })
    })

    test("counts past a hundred as 99+", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const placeId = await createPlace(t, "anna")
        for (let index = 0; index < 100; index += 1) {
            const fan = `fan${index}`
            await registerUser(t, fan)
            await befriend(t, "anna", fan)
            await asUser(t, fan).mutation(api.places.setSave, { placeId, status: "want" })
        }

        expect(await asUser(t, "anna").query(api.places.get, { id: placeId })).toMatchObject({ wantCount: "99+" })
    })

    test("rejects saves on invisible places", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "cas")
        const placeId = await createPlace(t, "anna")

        await expect(asUser(t, "cas").mutation(api.places.setSave, { placeId, status: "want" })).rejects.toThrow(
            "not visible",
        )
    })
})

describe("places group places", () => {
    test("adds, lists, and removes group places for members", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        await joinGroup(t, groupId, "anna", "ben")
        const placeId = await createPlace(t, "ben")

        await asUser(t, "ben").mutation(api.places.addToGroup, { groupId, placeId })
        expect(await asUser(t, "anna").query(api.places.forGroup, { groupId })).toHaveLength(1)

        await asUser(t, "anna").mutation(api.places.removeFromGroup, { groupId, placeId })
        expect(await asUser(t, "anna").query(api.places.forGroup, { groupId })).toEqual([])
    })

    test("adding twice keeps one link and removing a missing link fails", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        const placeId = await createPlace(t, "anna")

        const first = await asUser(t, "anna").mutation(api.places.addToGroup, { groupId, placeId })
        const second = await asUser(t, "anna").mutation(api.places.addToGroup, { groupId, placeId })
        expect(second).toBe(first)

        await asUser(t, "anna").mutation(api.places.removeFromGroup, { groupId, placeId })
        await expect(asUser(t, "anna").mutation(api.places.removeFromGroup, { groupId, placeId })).rejects.toThrow(
            "not in this group",
        )
    })

    test("rejects group writes from non-members and invisible places", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "cas")
        const groupId = await asUser(t, "anna").mutation(api.groups.create, { name: "Food Crew" })
        const placeId = await createPlace(t, "anna")

        await expect(asUser(t, "cas").mutation(api.places.addToGroup, { groupId, placeId })).rejects.toThrow(
            "membership required",
        )
        await expect(asUser(t, "cas").query(api.places.forGroup, { groupId })).rejects.toThrow("membership required")
    })
})

describe("places.mine", () => {
    test("lists only the viewer's places", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        await createPlace(t, "anna", "Anna's Place")
        await createPlace(t, "ben", "Ben's Place")

        const mine = await asUser(t, "anna").query(api.places.mine, {})
        expect(mine.map((card) => card.name)).toEqual(["Anna's Place"])
    })
})
