import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, it, vi } from "vitest"

import { api, internal } from "@convex/_generated/api"
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

async function storeBlob(t: TestConvexForDataModel<DataModel>): Promise<string> {
    const storageId: unknown = await t.run(async (ctx) =>
        ctx.storage.store(new Blob(["pixels"], { type: "image/jpeg" })),
    )
    if (typeof storageId !== "string") {
        throw new TypeError("Expected storage to return an ID string")
    }
    return storageId
}
async function createRestaurant(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"restaurants">> {
    return asUser(t, subject).action(api.restaurants.addWithOpeningHours, {
        name: "Trattoria Verde",
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
    })
}

async function recordUpload(t: TestConvexForDataModel<DataModel>, storageId: string, ownerId: string): Promise<void> {
    await t.mutation(internal.uploads.record, { storageId, ownerId })
}

async function insertRestaurantWithImages(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    images: { url: string; storageId: string }[],
): Promise<Id<"restaurants">> {
    const { restaurantId } = await t.mutation(internal.restaurants._insertRestaurant, {
        ownerId: subject,
        ownerName: subject,
        name: "Trattoria Verde",
        cuisine: "Italian",
        address: { label: "Luxembourg City" },
        images,
    })
    return restaurantId
}

async function attachImage(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    restaurantId: Id<"restaurants">,
    storageId: string,
): Promise<void> {
    await asUser(t, subject).mutation(api.restaurants.update, {
        id: restaurantId,
        images: [{ url: `https://example.com/${storageId}.jpg`, storageId }],
    })
}

function imageEntry(storageId: string): { url: string; storageId: string } {
    return { url: `https://example.com/${storageId}.jpg`, storageId }
}

describe("upload ownership", () => {
    it("refuses to delete a storage ID that is not part of the restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const attachedId = await storeBlob(t)
        await recordUpload(t, attachedId, "anna")
        await attachImage(t, "anna", restaurantId, attachedId)
        const foreignId = await storeBlob(t)

        await expect(
            asUser(t, "anna").mutation(api.restaurants.deleteImage, {
                restaurantId,
                imageUrl: `https://example.com/${foreignId}.jpg`,
                storageId: foreignId,
            }),
        ).rejects.toThrow("not part of this restaurant")
    })

    it("deletes a matching image entry", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const attachedId = await storeBlob(t)
        await recordUpload(t, attachedId, "anna")
        await attachImage(t, "anna", restaurantId, attachedId)

        await asUser(t, "anna").mutation(api.restaurants.deleteImage, {
            restaurantId,
            imageUrl: `https://example.com/${attachedId}.jpg`,
            storageId: attachedId,
        })

        const owned = await asUser(t, "anna").query(api.restaurants.get, {})
        expect(owned.find((r) => r._id === restaurantId)?.images).toEqual([])
    })

    it("refuses to attach an image uploaded by someone else", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const restaurantId = await createRestaurant(t, "anna")
        const bensFile = await storeBlob(t)
        await recordUpload(t, bensFile, "ben")

        await expect(attachImage(t, "anna", restaurantId, bensFile)).rejects.toThrow("does not belong")
    })

    it("refuses to delete a grafted image with a foreign ownership record", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const bensFile = await storeBlob(t)
        await recordUpload(t, bensFile, "ben")
        const restaurantId = await insertRestaurantWithImages(t, "anna", [imageEntry(bensFile)])

        await expect(
            asUser(t, "anna").mutation(api.restaurants.deleteImage, {
                restaurantId,
                imageUrl: `https://example.com/${bensFile}.jpg`,
                storageId: bensFile,
            }),
        ).rejects.toThrow("does not belong")
        await expect(
            asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { restaurantId, storageId: bensFile }),
        ).rejects.toThrow("does not belong")
    })

    it("refuses to attach a storage ID with no ownership record", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const restaurantId = await createRestaurant(t, "ben")
        const unrecordedId = await storeBlob(t)

        await expect(attachImage(t, "ben", restaurantId, unrecordedId)).rejects.toThrow("does not belong")
    })

    it("refuses to attach a file already attached to another restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const firstId = await createRestaurant(t, "anna")
        const secondId = await createRestaurant(t, "anna")
        const sharedId = await storeBlob(t)
        await recordUpload(t, sharedId, "anna")
        await attachImage(t, "anna", firstId, sharedId)

        await expect(attachImage(t, "anna", secondId, sharedId)).rejects.toThrow("another restaurant")
    })

    it("refuses orphan cleanup of a file attached to a restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const attachedId = await storeBlob(t)
        await recordUpload(t, attachedId, "anna")
        await attachImage(t, "anna", restaurantId, attachedId)

        await expect(
            asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { storageId: attachedId }),
        ).rejects.toThrow("attached")
    })

    it("refuses to delete an image with no ownership record", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const victimId = await storeBlob(t)
        const restaurantId = await insertRestaurantWithImages(t, "ben", [imageEntry(victimId)])

        await expect(
            asUser(t, "ben").mutation(api.restaurants.deleteImage, {
                restaurantId,
                imageUrl: `https://example.com/${victimId}.jpg`,
                storageId: victimId,
            }),
        ).rejects.toThrow("does not belong")
    })

    it("refuses restaurant cleanup for a storage ID with no ownership record", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const victimId = await storeBlob(t)
        const restaurantId = await insertRestaurantWithImages(t, "ben", [imageEntry(victimId)])

        await expect(
            asUser(t, "ben").mutation(api.restaurants.cleanupStorage, { restaurantId, storageId: victimId }),
        ).rejects.toThrow("does not belong")
    })

    it("removes the restaurant but leaves foreign and unrecorded blobs alone", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const bensFile = await storeBlob(t)
        await recordUpload(t, bensFile, "ben")
        const unrecordedId = await storeBlob(t)
        const restaurantId = await insertRestaurantWithImages(t, "anna", [
            imageEntry(bensFile),
            imageEntry(unrecordedId),
        ])

        await asUser(t, "anna").mutation(api.restaurants.remove, { id: restaurantId })

        const owned = await asUser(t, "anna").query(api.restaurants.get, {})
        expect(owned.find((r) => r._id === restaurantId)).toBeUndefined()
        expect(await t.query(internal.uploads.ownerByStorage, { storageId: bensFile })).toBe("ben")
    })

    it("refuses orphan cleanup from a non-owner", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const orphanId = await storeBlob(t)
        await t.mutation(internal.uploads.record, { storageId: orphanId, ownerId: "anna" })

        await expect(
            asUser(t, "ben").mutation(api.restaurants.cleanupStorage, { storageId: orphanId }),
        ).rejects.toThrow("does not belong")
    })

    it("lets the owner clean up an orphan upload", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const orphanId = await storeBlob(t)
        await t.mutation(internal.uploads.record, { storageId: orphanId, ownerId: "anna" })

        await asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { storageId: orphanId })

        await expect(
            asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { storageId: orphanId }),
        ).rejects.toThrow("does not belong")
    })

    it("deduplicates rapid double-submits with the same client mutation key", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const key = "anna:repeated-key"

        const first = await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            clientMutationId: key,
        })
        const second = await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            clientMutationId: key,
        })

        expect(second).toEqual(first)
        const owned = await asUser(t, "anna").query(api.restaurants.get, {})
        expect(owned.filter((r) => r.name === "Trattoria Verde")).toHaveLength(1)
        expect(owned.find((r) => r._id === first)?.clientMutationId).toBe(key)
    })

    it("keeps distinct client mutation keys as distinct restaurants", async () => {
        const t = setup()
        await registerUser(t, "anna")

        await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            clientMutationId: "anna:first-key",
        })
        await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Sushi Bar",
            cuisine: "Japanese",
            addressLabel: "Luxembourg City",
            clientMutationId: "anna:second-key",
        })

        const owned = await asUser(t, "anna").query(api.restaurants.get, {})
        expect(owned).toHaveLength(2)
    })

    it("scopes client mutation keys per user", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const key = "shared-key"

        const annas = await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            clientMutationId: key,
        })
        const bens = await asUser(t, "ben").action(api.restaurants.addWithOpeningHours, {
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            clientMutationId: key,
        })

        expect(bens).not.toEqual(annas)
    })

    it("refuses restaurant cleanup for a storage ID outside the restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const attachedId = await storeBlob(t)
        await recordUpload(t, attachedId, "anna")
        await attachImage(t, "anna", restaurantId, attachedId)
        const foreignId = await storeBlob(t)

        await expect(
            asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { restaurantId, storageId: foreignId }),
        ).rejects.toThrow("not part of this restaurant")
    })
})
