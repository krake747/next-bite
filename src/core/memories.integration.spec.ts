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
    await asUser(t, subject).mutation(api.users.ensureProfile, { email: `${subject}@example.com`, name: subject })
}

async function storeBlob(t: TestConvexForDataModel<DataModel>): Promise<Id<"_storage">> {
    const storageId: unknown = await t.run(async (ctx) =>
        ctx.storage.store(new Blob(["pixels"], { type: "image/jpeg" })),
    )
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

async function recordUpload(
    t: TestConvexForDataModel<DataModel>,
    storageId: Id<"_storage">,
    ownerId: string,
): Promise<void> {
    await t.mutation(internal.uploads.record, { storageId, ownerId })
}

function imageEntry(storageId: Id<"_storage">): { url: string; storageId: Id<"_storage"> } {
    return { url: `https://example.com/${storageId}.jpg`, storageId }
}

describe("upload CORS", () => {
    test("sends no wildcard origin header", async () => {
        const t = setup()
        const response = await t.fetch("/upload", {
            method: "OPTIONS",
        })
        expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull()
    })

    test("rejects unauthenticated uploads", async () => {
        const t = setup()
        const response = await t.fetch("/upload", {
            method: "POST",
            headers: { "Content-Type": "image/jpeg" },
            body: new Blob(["pixels"], { type: "image/jpeg" }),
        })
        expect(response.status).toBe(401)
        expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull()
    })
})

describe("visit memories", () => {
    test("lets a visible friend add a memory with their own photo", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const restaurantId = await createRestaurant(t, "anna")
        await asUser(t, "anna").mutation(api.shares.shareWithUser, { restaurantId, userId: "ben" })
        const bensFile = await storeBlob(t)
        await recordUpload(t, bensFile, "ben")

        await asUser(t, "ben").mutation(api.restaurants.addVisitMemory, {
            restaurantId,
            images: [imageEntry(bensFile)],
        })

        const memories = await asUser(t, "ben").query(api.restaurants.listVisitMemories, { restaurantId })
        expect(memories).toHaveLength(1)
        expect(memories[0]).toMatchObject({
            userId: "ben",
            displayName: "ben",
            restaurantId,
        })
        expect(memories[0]?.images).toEqual([
            expect.objectContaining({
                storageId: bensFile,
                ownerId: "ben",
                displayName: "ben",
                mimeType: "image/jpeg",
            }),
        ])
    })

    test("rejects memories on a restaurant the caller cannot see", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "cas")
        const restaurantId = await createRestaurant(t, "anna")
        const casFile = await storeBlob(t)
        await recordUpload(t, casFile, "cas")

        await expect(
            asUser(t, "cas").mutation(api.restaurants.addVisitMemory, {
                restaurantId,
                images: [imageEntry(casFile)],
            }),
        ).rejects.toThrow("not visible")
        await expect(asUser(t, "cas").query(api.restaurants.listVisitMemories, { restaurantId })).resolves.toEqual([])
    })

    test("rejects foreign blobs in memories", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const restaurantId = await createRestaurant(t, "anna")
        await asUser(t, "anna").mutation(api.shares.shareWithUser, { restaurantId, userId: "ben" })
        const annasFile = await storeBlob(t)
        await recordUpload(t, annasFile, "anna")

        await expect(
            asUser(t, "ben").mutation(api.restaurants.addVisitMemory, {
                restaurantId,
                images: [imageEntry(annasFile)],
            }),
        ).rejects.toThrow("does not belong")
    })

    test("lists memories newest first", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const restaurantId = await createRestaurant(t, "anna")
        await asUser(t, "anna").mutation(api.shares.shareWithUser, { restaurantId, userId: "ben" })
        const firstFile = await storeBlob(t)
        await recordUpload(t, firstFile, "ben")
        await asUser(t, "ben").mutation(api.restaurants.addVisitMemory, {
            restaurantId,
            images: [imageEntry(firstFile)],
        })
        const secondFile = await storeBlob(t)
        await recordUpload(t, secondFile, "anna")
        await asUser(t, "anna").mutation(api.restaurants.addVisitMemory, {
            restaurantId,
            images: [imageEntry(secondFile)],
        })

        const memories = await asUser(t, "anna").query(api.restaurants.listVisitMemories, { restaurantId })
        expect(memories.map((memory) => memory.userId)).toEqual(["anna", "ben"])
    })
})
