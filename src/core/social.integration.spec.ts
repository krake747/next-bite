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

async function registerUser(t: TestConvexForDataModel<DataModel>, subject: string, email: string): Promise<void> {
    await asUser(t, subject).mutation(api.identity.ensureProfile, { email, name: subject })
}

async function idOf(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"profiles">> {
    const me = await asUser(t, subject).query(api.identity.me, {})
    if (me.status !== "ready") {
        throw new Error(`No profile for ${subject}`)
    }
    return me.profile._id
}

type FriendshipRow = { userId: Id<"profiles">; friendId: Id<"profiles">; status: string }

async function friendshipRows(t: TestConvexForDataModel<DataModel>): Promise<FriendshipRow[]> {
    const rows = await t.run(async (ctx) => ctx.db.query("friendships").collect())
    return rows.map(({ userId, friendId, status }) => ({ userId, friendId, status }))
}

describe("social", () => {
    test("requests by email and surfaces pending requests both ways", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")

        await asUser(t, "anna").mutation(api.social.requestByEmail, { email: "ben@example.com" })

        const annasView = await asUser(t, "anna").query(api.social.requests, {})
        expect(annasView.incoming).toEqual([])
        expect(annasView.outgoing).toEqual([{ profileId: await idOf(t, "ben"), name: "ben" }])
        const bensView = await asUser(t, "ben").query(api.social.requests, {})
        expect(bensView.incoming).toEqual([{ profileId: await idOf(t, "anna"), name: "anna" }])
        expect(bensView.outgoing).toEqual([])

        await asUser(t, "ben").mutation(api.social.accept, { friendId: await idOf(t, "anna") })

        expect(await asUser(t, "anna").query(api.social.friends, {})).toEqual([
            { profileId: await idOf(t, "ben"), name: "ben" },
        ])
        expect(await asUser(t, "ben").query(api.social.friends, {})).toEqual([
            { profileId: await idOf(t, "anna"), name: "anna" },
        ])
        expect((await asUser(t, "anna").query(api.social.requests, {})).outgoing).toEqual([])
    })

    test("rejects friend requests to self", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")

        await expect(
            asUser(t, "anna").mutation(api.social.requestByEmail, { email: "anna@example.com" }),
        ).rejects.toThrow("yourself")
    })

    test("rejects friend requests to unknown emails", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")

        await expect(
            asUser(t, "anna").mutation(api.social.requestByEmail, { email: "nobody@example.com" }),
        ).rejects.toThrow("Nobody joined")
    })

    test("rejects accepting without a pending request", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "cas", "cas@example.com")

        await expect(asUser(t, "cas").mutation(api.social.accept, { friendId: await idOf(t, "anna") })).rejects.toThrow(
            "No pending friend request",
        )
    })

    test("completes mutual requests as friends without dangling pendings", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await asUser(t, "anna").mutation(api.social.requestByEmail, { email: "ben@example.com" })
        await asUser(t, "ben").mutation(api.social.requestByEmail, { email: "anna@example.com" })

        expect(await asUser(t, "anna").query(api.social.friends, {})).toEqual([
            { profileId: await idOf(t, "ben"), name: "ben" },
        ])
        expect((await asUser(t, "anna").query(api.social.requests, {})).outgoing).toEqual([])
        expect((await asUser(t, "ben").query(api.social.requests, {})).incoming).toEqual([])
    })

    test("removes friendships on both sides", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await asUser(t, "anna").mutation(api.social.requestByEmail, { email: "ben@example.com" })
        await asUser(t, "ben").mutation(api.social.accept, { friendId: await idOf(t, "anna") })

        await asUser(t, "anna").mutation(api.social.remove, { friendId: await idOf(t, "ben") })

        expect(await asUser(t, "anna").query(api.social.friends, {})).toEqual([])
        expect(await asUser(t, "ben").query(api.social.friends, {})).toEqual([])
    })
    test("accepting writes one accepted row per direction", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const anna = await idOf(t, "anna")
        const ben = await idOf(t, "ben")

        await expect(asUser(t, "anna").mutation(api.social.requestByEmail, { email: "ben@example.com" })).resolves.toBe(
            "pending",
        )
        expect(await friendshipRows(t)).toEqual([{ userId: anna, friendId: ben, status: "pending" }])

        await asUser(t, "ben").mutation(api.social.accept, { friendId: anna })

        expect(await friendshipRows(t)).toEqual(
            expect.arrayContaining([
                { userId: anna, friendId: ben, status: "accepted" },
                { userId: ben, friendId: anna, status: "accepted" },
            ]),
        )
        expect(await friendshipRows(t)).toHaveLength(2)
    })
})
