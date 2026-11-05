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

    it("shares group collections only with visible restaurants", async () => {
        const t = setup()
        await registerUser(t, "anna", "anna@example.com")
        await registerUser(t, "ben", "ben@example.com")
        const groupId = await asUser(t, "anna").mutation(api.groups.createGroup, { name: "Food Crew" })
        await asUser(t, "anna").mutation(api.groups.addMember, { groupId, userId: "ben" })
        const restaurantId = await createRestaurant(t, "anna")
        const collectionId = await asUser(t, "anna").mutation(api.collections.createCollection, {
            name: "To try",
            description: "",
            groupId,
        })

        await expect(
            asUser(t, "ben").mutation(api.collections.addItem, { collectionId, restaurantId }),
        ).rejects.toThrow("not shared with you")
        await asUser(t, "anna").mutation(api.shares.shareWithGroup, { restaurantId, groupId })
        const first = await asUser(t, "ben").mutation(api.collections.addItem, { collectionId, restaurantId })
        const second = await asUser(t, "ben").mutation(api.collections.addItem, { collectionId, restaurantId })
        expect(second).toEqual(first)
        const items = await asUser(t, "ben").query(api.collections.listItems, { collectionId })
        expect(items).toHaveLength(1)
    })
})
