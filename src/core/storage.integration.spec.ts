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

async function createPlace(
    t: TestConvexForDataModel<DataModel>,
    subject: string,
    photoIds: ReadonlyArray<Id<"_storage">> = [],
): Promise<Id<"places">> {
    return asUser(t, subject).mutation(api.places.create, {
        name: "Trattoria Verde",
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
        photos: photoIds.map((storageId) => ({ storageId })),
    })
}

async function idOf(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"profiles">> {
    const me = await asUser(t, subject).query(api.identity.me, {})
    if (me.status !== "ready") {
        throw new Error(`No profile for ${subject}`)
    }
    return me.profile._id
}

async function blobExists(t: TestConvexForDataModel<DataModel>, storageId: Id<"_storage">): Promise<boolean> {
    return t.run(async (ctx) => (await ctx.db.system.get("_storage", storageId)) !== null)
}

async function claimCount(t: TestConvexForDataModel<DataModel>, storageId: Id<"_storage">): Promise<number> {
    return t.run(
        async (ctx) =>
            (
                await ctx.db
                    .query("photos")
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

describe("photo claims", () => {
    test("claims photos submitted with a new place", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const storedId = await storeBlob(t)

        const placeId = await createPlace(t, "anna", [storedId])

        expect(await claimCount(t, storedId)).toBe(1)
        const card = await asUser(t, "anna").query(api.places.get, { id: placeId })
        expect(card?.photos.map((photo) => photo.storageId)).toEqual([storedId])
    })

    test("refuses a file already claimed by another place", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const sharedId = await storeBlob(t)
        await createPlace(t, "anna", [sharedId])

        await expect(createPlace(t, "ben", [sharedId])).rejects.toThrow("already claimed")
    })

    test("refuses a file someone holds as their avatar", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const bensFile = await storeBlob(t)
        await asUser(t, "ben").mutation(api.identity.setAvatar, { storageId: bensFile })

        await expect(createPlace(t, "anna", [bensFile])).rejects.toThrow("already claimed")
    })

    test("reads type and size from storage and rejects non-images and missing files", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const textFile = await storeBlob(t, "text/plain")
        const goneFile = await storeBlob(t)
        await t.run(async (ctx) => ctx.storage.delete(goneFile))

        await expect(createPlace(t, "anna", [textFile])).rejects.toThrow("Invalid content type")
        await expect(createPlace(t, "anna", [goneFile])).rejects.toThrow("Upload not found")
    })
})

describe("deleteUpload", () => {
    test("deletes unclaimed uploads and refuses claimed ones", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const attachedId = await storeBlob(t)
        await createPlace(t, "anna", [attachedId])
        const orphanId = await storeBlob(t)

        await expect(asUser(t, "anna").mutation(api.storage.deleteUpload, { storageId: attachedId })).rejects.toThrow(
            "already claimed",
        )
        await asUser(t, "anna").mutation(api.storage.deleteUpload, { storageId: orphanId })
        await asUser(t, "anna").mutation(api.storage.deleteUpload, { storageId: orphanId })

        expect(await blobExists(t, orphanId)).toBe(false)
        expect(await blobExists(t, attachedId)).toBe(true)
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

    test("an avatar id cannot become a place photo", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const avatarId = await storeBlob(t)
        await asUser(t, "anna").mutation(api.identity.setAvatar, { storageId: avatarId })

        await expect(createPlace(t, "anna", [avatarId])).rejects.toThrow("already claimed")
    })
})

describe("unclaimed cleanup", () => {
    test("deletes only unclaimed blobs older than a day", async () => {
        vi.useFakeTimers()
        try {
            const t = setup()
            await registerUser(t, "anna")
            const avatarId = await storeBlob(t)
            const imageId = await storeBlob(t)
            const orphanId = await storeBlob(t)
            await asUser(t, "anna").mutation(api.identity.setAvatar, { storageId: avatarId })
            await createPlace(t, "anna", [imageId])

            vi.advanceTimersByTime(25 * 60 * 60 * 1000)
            const freshId = await storeBlob(t)

            await expect(t.mutation(internal.storage.cleanupUnclaimed, { cursor: null })).resolves.toEqual({
                checked: 4,
                deleted: 1,
            })
            expect(await blobExists(t, orphanId)).toBe(false)
            expect(await blobExists(t, avatarId)).toBe(true)
            expect(await blobExists(t, imageId)).toBe(true)
            expect(await blobExists(t, freshId)).toBe(true)
        } finally {
            vi.useRealTimers()
        }
    })
})
