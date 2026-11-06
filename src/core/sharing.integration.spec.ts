import { convexTest, type TestConvexForDataModel } from "convex-test"
import { describe, expect, it, vi } from "vitest"

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

async function createRestaurant(t: TestConvexForDataModel<DataModel>, subject: string): Promise<Id<"restaurants">> {
    return asUser(t, subject).action(api.restaurants.addWithOpeningHours, {
        name: "Trattoria Verde",
        cuisine: "Italian",
        addressLabel: "Luxembourg City",
    })
}

describe("sharing and social gating", () => {
    it("lets a shared user react and blocks strangers", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await asUser(t, "anna").mutation(api.shares.shareWithUser, { restaurantId, userId: "ben" })
        await asUser(t, "ben").mutation(api.social.toggleLike, { restaurantId })
        await expect(asUser(t, "cas").mutation(api.social.toggleLike, { restaurantId })).rejects.toThrow(
            "not shared with you",
        )
    })

    it("rejects non-owner writes and shares", async () => {
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
        await expect(
            asUser(t, "ben").mutation(api.shares.shareWithUser, { restaurantId, userId: "ben" }),
        ).rejects.toThrow("only the owner")
    })

    it("revokes reactions after unshare", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const restaurantId = await createRestaurant(t, "anna")

        await asUser(t, "anna").mutation(api.shares.shareWithUser, { restaurantId, userId: "ben" })
        await asUser(t, "ben").mutation(api.social.toggleLike, { restaurantId })
        await asUser(t, "anna").mutation(api.shares.unshare, { restaurantId, target: { kind: "user", userId: "ben" } })
        await expect(asUser(t, "ben").mutation(api.social.toggleLike, { restaurantId })).rejects.toThrow(
            "not shared with you",
        )
        await expect(asUser(t, "ben").mutation(api.social.addComment, { restaurantId, text: "hello" })).rejects.toThrow(
            "not shared with you",
        )
    })

    it("rejects anonymous and non-owner enrichment actions", async () => {
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

    it("accepts group invitations idempotently", async () => {
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

    it("accepts friend invitations idempotently on both sides", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")

        const token = await asUser(t, "anna").mutation(api.invitations.createInvite, { target: { kind: "friend" } })
        const first = await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })
        expect(first).toEqual({ result: "accepted", friendId: "anna" })
        const second = await asUser(t, "ben").mutation(api.invitations.acceptInvite, { token })
        expect(second).toEqual({ result: "alreadyMember", friendId: "anna" })

        const annaFriends = await asUser(t, "anna").query(api.friendships.listFriends, {})
        const benFriends = await asUser(t, "ben").query(api.friendships.listFriends, {})
        expect(annaFriends).toEqual([{ authUserId: "ben", name: "ben" }])
        expect(benFriends).toEqual([{ authUserId: "anna", name: "anna" }])
    })

    it("lists a group's shared restaurants for members only", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        await asUser(t, "anna").mutation(api.groups.addMember, { groupId, userId: "ben" })
        const restaurantId = await createRestaurant(t, "anna")
        await createRestaurant(t, "anna")
        await asUser(t, "anna").mutation(api.shares.shareWithGroup, { restaurantId, groupId })

        const items = await asUser(t, "ben").query(api.shares.listForGroup, { groupId })
        expect(items.map((item) => item._id)).toEqual([restaurantId])
        await expect(asUser(t, "cas").query(api.shares.listForGroup, { groupId })).rejects.toThrow(
            "membership required",
        )
    })

    it("reads group identity plus members for members and nothing for strangers", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        await asUser(t, "anna").mutation(api.groups.addMember, { groupId, userId: "ben" })

        const view = await asUser(t, "ben").query(api.groups.getGroup, { groupId })
        expect(view?.group.name).toBe("Food Crew")
        expect(view?.role).toBe("member")
        expect(view?.members.map((m) => m.userId).toSorted()).toEqual(["anna", "ben"])
        expect(await asUser(t, "cas").query(api.groups.getGroup, { groupId })).toBeNull()
    })

    it("rejects group writes without permission", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        await asUser(t, "anna").mutation(api.groups.addMember, { groupId, userId: "ben" })
        const restaurantId = await createRestaurant(t, "anna")

        await expect(asUser(t, "ben").mutation(api.groups.addMember, { groupId, userId: "anna" })).rejects.toThrow(
            "only admins",
        )
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

    it("requests by email and surfaces pending requests both ways", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")

        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })

        const annasView = await asUser(t, "anna").query(api.friendships.listFriendRequests, {})
        expect(annasView.incoming).toEqual([])
        expect(annasView.outgoing).toEqual([{ authUserId: "ben", name: "ben" }])
        const bensView = await asUser(t, "ben").query(api.friendships.listFriendRequests, {})
        expect(bensView.incoming).toEqual([{ authUserId: "anna", name: "anna" }])
        expect(bensView.outgoing).toEqual([])

        await asUser(t, "ben").mutation(api.friendships.acceptFriend, { friendAuthUserId: "anna" })

        expect(await asUser(t, "anna").query(api.friendships.listFriends, {})).toEqual([
            { authUserId: "ben", name: "ben" },
        ])
        expect(await asUser(t, "ben").query(api.friendships.listFriends, {})).toEqual([
            { authUserId: "anna", name: "anna" },
        ])
        expect((await asUser(t, "anna").query(api.friendships.listFriendRequests, {})).outgoing).toEqual([])
    })

    it("rejects friend requests to self", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")

        await expect(
            asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "anna@example.com" }),
        ).rejects.toThrow("yourself")
    })

    it("rejects friend requests to unknown emails", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")

        await expect(
            asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "nobody@example.com" }),
        ).rejects.toThrow("Nobody joined")
    })

    it("rejects accepting without a pending request", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "cas", "cas@example.com")

        await expect(
            asUser(t, "cas").mutation(api.friendships.acceptFriend, { friendAuthUserId: "anna" }),
        ).rejects.toThrow("No pending friend request")
    })

    it("completes mutual requests as friends without dangling pendings", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })
        await asUser(t, "ben").mutation(api.friendships.requestFriendByEmail, { email: "anna@example.com" })

        expect(await asUser(t, "anna").query(api.friendships.listFriends, {})).toEqual([
            { authUserId: "ben", name: "ben" },
        ])
        expect((await asUser(t, "anna").query(api.friendships.listFriendRequests, {})).outgoing).toEqual([])
        expect((await asUser(t, "ben").query(api.friendships.listFriendRequests, {})).incoming).toEqual([])
    })

    it("resolves mixed-case emails", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "Ben@Example.com")

        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })

        const bensView = await asUser(t, "ben").query(api.friendships.listFriendRequests, {})
        expect(bensView.incoming).toEqual([{ authUserId: "anna", name: "anna" }])
    })

    it("lists only visible discoveries per friend", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await registerUser(t, "cas", "cas@example.com")
        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })
        await asUser(t, "ben").mutation(api.friendships.acceptFriend, { friendAuthUserId: "anna" })
        const sharedId = await createRestaurant(t, "ben")
        await asUser(t, "ben").mutation(api.shares.shareWithUser, { restaurantId: sharedId, userId: "anna" })
        await createRestaurant(t, "ben")

        const discoveries = await asUser(t, "anna").query(api.friendships.listDiscoveries, {
            friendAuthUserId: "ben",
        })
        expect(discoveries.map((r) => r._id)).toEqual([sharedId])
        await expect(
            asUser(t, "anna").query(api.friendships.listDiscoveries, { friendAuthUserId: "cas" }),
        ).rejects.toThrow("friends only")
    })

    it("removes friendships on both sides", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        await asUser(t, "anna").mutation(api.friendships.requestFriendByEmail, { email: "ben@example.com" })
        await asUser(t, "ben").mutation(api.friendships.acceptFriend, { friendAuthUserId: "anna" })

        await asUser(t, "anna").mutation(api.friendships.removeFriend, { friendAuthUserId: "ben" })

        expect(await asUser(t, "anna").query(api.friendships.listFriends, {})).toEqual([])
        expect(await asUser(t, "ben").query(api.friendships.listFriends, {})).toEqual([])
    })
})
