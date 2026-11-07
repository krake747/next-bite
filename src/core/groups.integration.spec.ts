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

describe("group images", () => {
    test("serves group headers from the server upload record", async () => {
        const t = setup()
        await registerUser(t, "anna")
        const storageId = await storeBlob(t)
        await t.mutation(internal.uploads.record, { storageId, ownerId: "anna" })

        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, {
            name: "Food Crew",
            image: { url: "https://evil.example/spoof.jpg", storageId },
        })

        const detail = await asUser(t, "anna").query(api.groups.getGroup, { groupId })
        expect(detail?.group.image?.storageId).toBe(storageId)
        expect(detail?.group.image?.ownerId).toBe("anna")
        expect(detail?.group.image?.displayName).toBe("anna")
        expect(detail?.group.image?.url).not.toBe("https://evil.example/spoof.jpg")
    })

    test("rejects group headers from another owner's storage", async () => {
        const t = setup()
        await registerUser(t, "anna")
        await registerUser(t, "ben")
        const storageId = await storeBlob(t)
        await t.mutation(internal.uploads.record, { storageId, ownerId: "ben" })

        await expect(
            asUser(t, "anna").mutation(api.groups.createGroup, {
                name: "Food Crew",
                image: { url: "https://example.com/a.jpg", storageId },
            }),
        ).rejects.toThrow("does not belong to you")
    })
})
