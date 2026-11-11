import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, test, vi } from "vitest"

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
    await asUser(t, subject).mutation(api.identity.ensureProfile, { email: `${subject}@example.com`, name: subject })
}

async function storeBlob(t: TestConvexForDataModel<DataModel>, type = "image/jpeg"): Promise<Id<"_storage">> {
    const storageId: unknown = await t.run(async (ctx) => ctx.storage.store(new Blob(["pixels"], { type })))
    if (typeof storageId !== "string") {
        throw new TypeError("Expected storage to return an ID string")
    }
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- test storage mints real storage ids; the backend revalidates the table at every boundary
    return storageId as Id<"_storage">
}
async function createRestaurant(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"restaurants">> {
    return asUser(t, subject).action(api.restaurants.addWithOpeningHours, {
        name: "Trattoria Verde",
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
    })
}

async function idOf(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"profiles">> {
    const me = await asUser(t, subject).query(api.identity.me, {})
    if (me.status !== "ready") {
        throw new Error(`No profile for ${subject}`)
    }
    return me.profile._id
}

async function attachImage(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    restaurantId: Id<"restaurants">,
    storageId: Id<"_storage">,
): Promise<void> {
    await asUser(t, subject).mutation(api.restaurants.update, {
        id: restaurantId,
        images: [{ url: `https://example.com/${storageId}.jpg`, storageId }],
    })
}

function imageEntry(storageId: Id<"_storage">): { url: string; storageId: Id<"_storage"> } {
    return { url: `https://example.com/${storageId}.jpg`, storageId }
}

async function storedImageUrl(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    restaurantId: Id<"restaurants">,
    storageId: Id<"_storage">,
): Promise<string> {
    const owned = await asUser(t, subject).query(api.restaurants.get, {})
    const url = owned.find((r) => r._id === restaurantId)?.images.find((img) => img.storageId === storageId)?.url
    if (url === undefined) {
        throw new TypeError("Expected the image to be stored")
    }
    return url
}

async function blobExists(t: TestConvexForDataModel<DataModel>, storageId: Id<"_storage">): Promise<boolean> {
    return t.run(async (ctx) => (await ctx.db.system.get("_storage", storageId)) !== null)
}

async function claimCount(t: TestConvexForDataModel<DataModel>, storageId: Id<"_storage">): Promise<number> {
    return t.run(
        async (ctx) =>
            (
                await ctx.db
                    .query("restaurantImages")
                    .withIndex("by_storage", (q) => q.eq("storageId", storageId))
                    .collect()
            ).length,
    )
}

describe("upload urls", () => {
    test("issues upload urls only to callers with a profile", async () => {
        const t = setup()
        await registerUser(t, "anna")

        await expect(t.mutation(api.storage.generateUploadUrl, {})).rejects.toThrow("Unauthorized")
        await expect(asUser(t, "newcomer").mutation(api.storage.generateUploadUrl, {})).rejects.toThrow(
            "Unauthorized: profile required",
        )
        await expect(asUser(t, "anna").mutation(api.storage.generateUploadUrl, {})).resolves.toEqual(expect.any(String))
    })
})

describe("restaurant image claims", () => {
    test("deletes a matching image entry and its blob", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const attachedId = await storeBlob(t)
        await attachImage(t, "anna", restaurantId, attachedId)

        await asUser(t, "anna").mutation(api.restaurants.deleteImage, {
            restaurantId,
            imageUrl: await storedImageUrl(t, "anna", restaurantId, attachedId),
            storageId: attachedId,
        })

        const owned = await asUser(t, "anna").query(api.restaurants.get, {})
        expect(owned.find((r) => r._id === restaurantId)?.images).toEqual([])
        expect(await blobExists(t, attachedId)).toBe(false)
        expect(await claimCount(t, attachedId)).toBe(0)
    })

    test("refuses to delete a storage ID that is not part of the restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const foreignId = await storeBlob(t)

        await expect(
            asUser(t, "anna").mutation(api.restaurants.deleteImage, {
                restaurantId,
                imageUrl: `https://example.com/${foreignId}.jpg`,
                storageId: foreignId,
            }),
        ).rejects.toThrow("not part of this restaurant")
        await expect(
            asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { restaurantId, storageId: foreignId }),
        ).rejects.toThrow("not part of this restaurant")
    })

    test("refuses a file already claimed by another restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const annasPlace = await createRestaurant(t, "anna")
        const bensPlace = await createRestaurant(t, "ben")
        const sharedId = await storeBlob(t)
        await attachImage(t, "anna", annasPlace, sharedId)

        await expect(attachImage(t, "ben", bensPlace, sharedId)).rejects.toThrow("already claimed")
        await expect(attachImage(t, "anna", await createRestaurant(t, "anna"), sharedId)).rejects.toThrow(
            "already claimed",
        )
    })

    test("refuses a file someone holds as their avatar", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const restaurantId = await createRestaurant(t, "anna")
        const bensFile = await storeBlob(t)
        await asUser(t, "ben").mutation(api.identity.setAvatar, { storageId: bensFile })

        await expect(attachImage(t, "anna", restaurantId, bensFile)).rejects.toThrow("already claimed")
    })

    test("reads type and size from storage and rejects non-images and missing files", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const textFile = await storeBlob(t, "text/plain")
        const goneFile = await storeBlob(t)
        await t.run(async (ctx) => ctx.storage.delete(goneFile))

        await expect(attachImage(t, "anna", restaurantId, textFile)).rejects.toThrow("Invalid content type")
        await expect(attachImage(t, "anna", restaurantId, goneFile)).rejects.toThrow("Upload not found")
    })

    test("refuses orphan cleanup of an attached file and deletes unclaimed ones", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const attachedId = await storeBlob(t)
        await attachImage(t, "anna", restaurantId, attachedId)
        const orphanId = await storeBlob(t)

        await expect(
            asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { storageId: attachedId }),
        ).rejects.toThrow("attached")
        await asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { storageId: orphanId })
        await asUser(t, "anna").mutation(api.restaurants.cleanupStorage, { storageId: orphanId })

        expect(await blobExists(t, orphanId)).toBe(false)
        expect(await blobExists(t, attachedId)).toBe(true)
    })

    test("removing a restaurant deletes its claimed blobs only", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const annasFile = await storeBlob(t)
        const bensAvatar = await storeBlob(t)
        await asUser(t, "ben").mutation(api.identity.setAvatar, { storageId: bensAvatar })
        const restaurantId = await createRestaurant(t, "anna")
        await attachImage(t, "anna", restaurantId, annasFile)

        await asUser(t, "anna").mutation(api.restaurants.remove, { id: restaurantId })

        expect(await blobExists(t, annasFile)).toBe(false)
        expect(await claimCount(t, annasFile)).toBe(0)
        expect(await blobExists(t, bensAvatar)).toBe(true)
    })

    test("embeds server-derived attribution when attaching", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const restaurantId = await createRestaurant(t, "anna")
        const storedId = await storeBlob(t)
        await attachImage(t, "anna", restaurantId, storedId)

        const owned = await asUser(t, "anna").query(api.restaurants.get, {})
        expect(owned.find((r) => r._id === restaurantId)?.images).toEqual([
            expect.objectContaining({
                storageId: storedId,
                ownerId: await idOf(t, "anna"),
                mimeType: "image/jpeg",
                byteSize: 6,
            }),
        ])
    })

    test("claims images submitted with a new restaurant", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const storedId = await storeBlob(t)

        const restaurantId = await asUser(t, "anna").action(api.restaurants.addWithOpeningHours, {
            name: "Trattoria Verde",
            cuisine: "Italian",
            addressLabel: "Luxembourg City",
            images: [imageEntry(storedId)],
        })

        expect(await claimCount(t, storedId)).toBe(1)
        expect(await storedImageUrl(t, "anna", restaurantId, storedId)).not.toBe(imageEntry(storedId).url)
    })

    test("deduplicates rapid double-submits with the same client mutation key", async () => {
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

    test("keeps distinct client mutation keys as distinct restaurants", async () => {
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

    test("scopes client mutation keys per user", async () => {
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
})

describe("avatar claims", () => {
    test("stores server-derived avatar metadata", async () => {
        const t = setup()
        await registerUser(t, "ben")
        const bensFile = await storeBlob(t)

        await asUser(t, "ben").mutation(api.identity.setAvatar, { storageId: bensFile })
        await asUser(t, "ben").mutation(api.identity.setAvatar, { storageId: bensFile })

        const me = await asUser(t, "ben").query(api.identity.me, {})
        expect(me).toMatchObject({
            status: "ready",
            profile: {
                avatar: {
                    storageId: bensFile,
                    ownerId: await idOf(t, "ben"),
                    mimeType: "image/jpeg",
                    byteSize: 6,
                },
            },
        })
    })

    test("a second account cannot claim the same storage id", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const bensFile = await storeBlob(t)
        await asUser(t, "ben").mutation(api.identity.setAvatar, { storageId: bensFile })

        await expect(asUser(t, "anna").mutation(api.identity.setAvatar, { storageId: bensFile })).rejects.toThrow(
            "already claimed",
        )
    })
})

describe("unclaimed cleanup", () => {
    test("deletes only unclaimed blobs older than a day", async () => {
        vi.useFakeTimers()
        try {
            const t = setup()
            await registerUser(t, "anna")
            const restaurantId = await createRestaurant(t, "anna")
            const avatarId = await storeBlob(t)
            const imageId = await storeBlob(t)
            const releasedId = await storeBlob(t)
            const orphanId = await storeBlob(t)
            await asUser(t, "anna").mutation(api.identity.setAvatar, { storageId: avatarId })
            await attachImage(t, "anna", restaurantId, releasedId)
            await attachImage(t, "anna", restaurantId, imageId)

            vi.advanceTimersByTime(25 * 60 * 60 * 1000)
            const freshId = await storeBlob(t)

            await expect(t.mutation(internal.storage.cleanupUnclaimed, { cursor: null })).resolves.toEqual({
                checked: 5,
                deleted: 2,
            })
            expect(await blobExists(t, orphanId)).toBe(false)
            expect(await blobExists(t, releasedId)).toBe(false)
            expect(await blobExists(t, avatarId)).toBe(true)
            expect(await blobExists(t, imageId)).toBe(true)
            expect(await blobExists(t, freshId)).toBe(true)
        } finally {
            vi.useRealTimers()
        }
    })

    test("backfills claims for images stored before claims existed", async () => {
        vi.useFakeTimers()
        try {
            const t = setup()
            await registerUser(t, "anna")
            const ownerId = await idOf(t, "anna")
            const legacyId = await storeBlob(t)
            await t.run(async (ctx) =>
                ctx.db.insert("restaurants", {
                    ownerId,
                    name: "Legacy Bistro",
                    cuisine: "French",
                    address: { label: "Luxembourg City" },
                    images: [imageEntry(legacyId)],
                    visibility: "private",
                }),
            )

            await expect(t.mutation(internal.storage.backfillImageClaims, {})).resolves.toEqual({
                checked: 1,
                claimed: 1,
            })
            await expect(t.mutation(internal.storage.backfillImageClaims, {})).resolves.toEqual({
                checked: 1,
                claimed: 0,
            })
            vi.advanceTimersByTime(25 * 60 * 60 * 1000)
            await t.mutation(internal.storage.cleanupUnclaimed, { cursor: null })
            expect(await blobExists(t, legacyId)).toBe(true)
        } finally {
            vi.useRealTimers()
        }
    })
})
