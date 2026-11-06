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

describe("upload ownership", () => {
    it("refuses to delete a storage ID that is not part of the restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const attachedId = await storeBlob(t)
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
        await attachImage(t, "anna", restaurantId, attachedId)

        await asUser(t, "anna").mutation(api.restaurants.deleteImage, {
            restaurantId,
            imageUrl: `https://example.com/${attachedId}.jpg`,
            storageId: attachedId,
        })

        const owned = await asUser(t, "anna").query(api.restaurants.get, {})
        expect(owned.find((r) => r._id === restaurantId)?.images).toEqual([])
    })

    it("refuses to delete an image uploaded by someone else", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const restaurantId = await createRestaurant(t, "anna")
        const bensFile = await storeBlob(t)
        await t.mutation(internal.uploads.record, { storageId: bensFile, ownerId: "ben" })
        await attachImage(t, "anna", restaurantId, bensFile)

        await expect(
            asUser(t, "anna").mutation(api.restaurants.deleteImage, {
                restaurantId,
                imageUrl: `https://example.com/${bensFile}.jpg`,
                storageId: bensFile,
            }),
        ).rejects.toThrow("does not belong")
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

    it("refuses restaurant cleanup for a storage ID outside the restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const attachedId = await storeBlob(t)
        await attachImage(t, "anna", restaurantId, attachedId)
        const foreignId = await storeBlob(t)

        await expect(
            asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { restaurantId, storageId: foreignId }),
        ).rejects.toThrow("not part of this restaurant")
    })
})
