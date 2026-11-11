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
    await asUser(t, subject).mutation(api.users.ensureProfile, { email, name: subject })
}

async function idOf(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"profiles">> {
    const me = await asUser(t, subject).query(api.users.getMe, {})
    if (me.status !== "ready") {
        throw new Error(`No profile for ${subject}`)
    }
    return me.profile._id
}

async function befriend(t: TestConvexForDataModel<DataModel>, a: string, b: string): Promise<void> {
    const token = await asUser(t, a).mutation(api.invitations.createInvite, { target: { kind: "friend" } })
    await asUser(t, b).mutation(api.invitations.acceptInvite, { token })
}

async function createRestaurant(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"restaurants">> {
    return asUser(t, subject).action(api.restaurants.addWithOpeningHours, {
        name: "Trattoria Verde",
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
    })
}

async function joinGroup(
    t: TestConvexForDataModel<DataModel>,
    groupId: Id<"groups">,
    owner: string,
    subject: string,
): Promise<void> {
    const token = await asUser(t, owner).mutation(api.invitations.createInvite, { target: { kind: "group", groupId } })
    await asUser(t, subject).mutation(api.invitations.acceptInvite, { token })
}

describe("profile references", () => {
    test("stores the owner as a profile id and resolves the name at read time", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        const [before] = await asUser(t, "anna").query(api.restaurants.get, {})
        expect(before?.ownerId).toBe(await idOf(t, "anna"))
        expect(before?.ownerName).toBe("anna")

        await asUser(t, "anna").mutation(api.users.updateMe, { name: "Anna B" })
        const after = await asUser(t, "anna").query(api.restaurants.getById, { id: restaurantId })
        expect(after?.ownerName).toBe("Anna B")
    })

    test("rejects writes until the caller has a profile and reads empty meanwhile", async () => {
        const t = setup()

        await expect(asUser(t, "newcomer").mutation(api.groups.createGroup, { name: "Food Crew" })).rejects.toThrow(
            "Unauthorized: profile required",
        )
        await expect(asUser(t, "newcomer").query(api.groups.listMyGroups, {})).resolves.toEqual([])
        await expect(asUser(t, "newcomer").query(api.restaurants.feed, {})).resolves.toEqual([])
    })
})

describe("sharing and social gating", () => {
    test("lets a friend react and blocks strangers", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await befriend(t, "anna", "ben")
        await asUser(t, "ben").mutation(api.social.toggleInterest, { restaurantId, status: "want" })
        await expect(
            asUser(t, "cas").mutation(api.social.toggleInterest, { restaurantId, status: "want" }),
        ).rejects.toThrow("not shared with you")
    })

    test("hides social rows from strangers", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await expect(asUser(t, "cas").query(api.social.getForRestaurant, { restaurantId })).resolves.toBeNull()
        await expect(t.query(api.social.getForRestaurant, { restaurantId })).resolves.toBeNull()

        await befriend(t, "anna", "ben")
        await expect(asUser(t, "ben").query(api.social.getForRestaurant, { restaurantId })).resolves.not.toBeNull()
        await expect(asUser(t, "anna").query(api.social.getForRestaurant, { restaurantId })).resolves.not.toBeNull()
    })

    test("hides summaries from strangers", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await expect(
            asUser(t, "cas").query(api.social.getSummaries, { restaurantIds: [restaurantId] }),
        ).resolves.toEqual([null])
        await expect(t.query(api.social.getSummaries, { restaurantIds: [restaurantId] })).resolves.toEqual([null])

        await befriend(t, "anna", "ben")
        const [summary] = await asUser(t, "ben").query(api.social.getSummaries, { restaurantIds: [restaurantId] })
        expect(summary).toMatchObject({ restaurantId, wantCount: 0 })
    })

    test("rejects non-owner writes and shares", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await expect(
            asUser(t, "ben").mutation(api.restaurants.update, { id: restaurantId, name: "Hijacked" }),
        ).rejects.toThrow("only the owner")
        await expect(asUser(t, "ben").mutation(api.restaurants.remove, { id: restaurantId })).rejects.toThrow(
            "only the owner",
        )
    })

    test("revokes reactions after unfriending", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await befriend(t, "anna", "ben")
        await asUser(t, "ben").mutation(api.social.toggleInterest, { restaurantId, status: "want" })
        await asUser(t, "anna").mutation(api.friendships.removeFriend, { friendId: await idOf(t, "ben") })
        await expect(
            asUser(t, "ben").mutation(api.social.toggleInterest, { restaurantId, status: "been" }),
        ).rejects.toThrow("not shared with you")
    })

    test("rejects anonymous and non-owner enrichment actions", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await expect(t.action(api.restaurants.lookupPlaceIdAndHours, { restaurantId })).rejects.toThrow("Unauthorized")
        await expect(asUser(t, "ben").action(api.restaurants.lookupPlaceIdAndHours, { restaurantId })).rejects.toThrow(
            "only the owner",
        )
        await expect(t.action(api.restaurants.refreshOpeningHours, { restaurantId })).rejects.toThrow("Unauthorized")
    })

    test("accepts group invitations idempotently", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })

        const token = await asUser(t, "anna").mutation(api.invitations.createInvite, {
            target: { kind: "group", groupId },
        })
        const first = await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })
        expect(first).toEqual({ result: "accepted", groupId })
        const second = await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })
        expect(second).toEqual({ result: "alreadyMember", groupId })

        const groups = await asUser(t, "ben").query(api.groups.listMyGroups, {})
        expect(groups).toHaveLength(1)
    })

    test("accepts friend invitations idempotently on both sides", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")

        const token = await asUser(t, "anna").mutation(api.invitations.createInvite, { target: { kind: "friend" } })
        const first = await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })
        expect(first).toEqual({ result: "accepted", friendId: await idOf(t, "anna") })
        const second = await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })
        expect(second).toEqual({ result: "alreadyMember", friendId: await idOf(t, "anna") })

        const annaFriends = await asUser(t, "anna").query(api.friendships.listFriends, {})
        const benFriends = await asUser(t, "ben").query(api.friendships.listFriends, {})
        expect(annaFriends).toEqual([{ profileId: await idOf(t, "ben"), name: "ben" }])
        expect(benFriends).toEqual([{ profileId: await idOf(t, "anna"), name: "anna" }])
    })

    test("lists a group's shared restaurants for members only", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        await joinGroup(t, groupId, "anna", "ben")
        const restaurantId = await createRestaurant(t, "anna")
        await createRestaurant(t, "anna")
        await asUser(t, "anna").mutation(api.shares.shareWithGroup, { restaurantId, groupId })

        const items = await asUser(t, "ben").query(api.shares.listForGroup, { groupId })
        expect(items.map((item) => item._id)).toEqual([restaurantId])
        await expect(asUser(t, "cas").query(api.shares.listForGroup, { groupId })).rejects.toThrow(
            "membership required",
        )
    })

    test("reads group identity plus members for members and nothing for strangers", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        await joinGroup(t, groupId, "anna", "ben")

        const view = await asUser(t, "ben").query(api.groups.getGroup, { groupId })
        expect(view?.group.name).toBe("Food Crew")
        expect(view?.isOwner).toBe(false)
        expect(view?.members.map((m) => m.userId).toSorted()).toEqual(
            [await idOf(t, "anna"), await idOf(t, "ben")].toSorted(),
        )
        expect(await asUser(t, "cas").query(api.groups.getGroup, { groupId })).toBeNull()
    })

    test("rejects group writes without permission", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        await joinGroup(t, groupId, "anna", "ben")
        const restaurantId = await createRestaurant(t, "anna")

        await expect(asUser(t, "ben").mutation(api.shares.shareWithGroup, { restaurantId, groupId })).rejects.toThrow(
            "only the owner",
        )
        await asUser(t, "anna").mutation(api.shares.shareWithGroup, { restaurantId, groupId })
        await expect(
            asUser(t, "ben").mutation(api.shares.unshare, {
                restaurantId,
                target: { kind: "group", groupId },
            }),
        ).rejects.toThrow("only the owner")
    })

    test("requests by email and surfaces pending requests both ways", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")

        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })

        const annasView = await asUser(t, "anna").query(api.friendships.listFriendRequests, {})
        expect(annasView.incoming).toEqual([])
        expect(annasView.outgoing).toEqual([{ profileId: await idOf(t, "ben"), name: "ben" }])
        const bensView = await asUser(t, "ben").query(api.friendships.listFriendRequests, {})
        expect(bensView.incoming).toEqual([{ profileId: await idOf(t, "anna"), name: "anna" }])
        expect(bensView.outgoing).toEqual([])

        await asUser(t, "ben").mutation(api.friendships.acceptFriend, { friendId: await idOf(t, "anna") })

        expect(await asUser(t, "anna").query(api.friendships.listFriends, {})).toEqual([
            { profileId: await idOf(t, "ben"), name: "ben" },
        ])
        expect(await asUser(t, "ben").query(api.friendships.listFriends, {})).toEqual([
            { profileId: await idOf(t, "anna"), name: "anna" },
        ])
        expect((await asUser(t, "anna").query(api.friendships.listFriendRequests, {})).outgoing).toEqual([])
    })

    test("rejects friend requests to self", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")

        await expect(
            asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "anna@example.com" }),
        ).rejects.toThrow("yourself")
    })

    test("rejects friend requests to unknown emails", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")

        await expect(
            asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "nobody@example.com" }),
        ).rejects.toThrow("Nobody joined")
    })

    test("rejects friend requests to unknown users", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        const ghost = await t.run(async (ctx) => {
            const id = await ctx.db.insert("profiles", {
                authUserId: "ghost",
                name: "ghost",
                email: "ghost@example.com",
            })
            await ctx.db.delete("profiles", id)
            return id
        })

        await expect(asUser(t, "anna").mutation(api.friendships.requestFriend, { friendId: ghost })).rejects.toThrow(
            "User not found",
        )
    })

    test("rejects accepting without a pending request", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "cas", "cas@example.com")

        await expect(
            asUser(t, "cas").mutation(api.friendships.acceptFriend, { friendId: await idOf(t, "anna") }),
        ).rejects.toThrow("No pending friend request")
    })

    test("completes mutual requests as friends without dangling pendings", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })
        await asUser(t, "ben").mutation(api.friendships.requestFriendByEmail, { email: "anna@example.com" })

        expect(await asUser(t, "anna").query(api.friendships.listFriends, {})).toEqual([
            { profileId: await idOf(t, "ben"), name: "ben" },
        ])
        expect((await asUser(t, "anna").query(api.friendships.listFriendRequests, {})).outgoing).toEqual([])
        expect((await asUser(t, "ben").query(api.friendships.listFriendRequests, {})).incoming).toEqual([])
    })

    test("resolves mixed-case emails", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "Ben@Example.com")

        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })

        const bensView = await asUser(t, "ben").query(api.friendships.listFriendRequests, {})
        expect(bensView.incoming).toEqual([{ profileId: await idOf(t, "anna"), name: "anna" }])
    })

    test("shows places to accepted friends, not pending ones", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })
        await asUser(t, "ben").mutation(api.friendships.acceptFriend, { friendId: await idOf(t, "anna") })
        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "cas@example.com" })
        const restaurantId = await createRestaurant(t, "anna")

        expect(await asUser(t, "ben").query(api.restaurants.getById, { id: restaurantId })).not.toBeNull()
        expect(await asUser(t, "cas").query(api.restaurants.getById, { id: restaurantId })).toBeNull()
    })

    test("removes friendships on both sides", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })
        await asUser(t, "ben").mutation(api.friendships.acceptFriend, { friendId: await idOf(t, "anna") })

        await asUser(t, "anna").mutation(api.friendships.removeFriend, { friendId: await idOf(t, "ben") })

        expect(await asUser(t, "anna").query(api.friendships.listFriends, {})).toEqual([])
        expect(await asUser(t, "ben").query(api.friendships.listFriends, {})).toEqual([])
    })
})
