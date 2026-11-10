import { defineTestApp } from "convex-test"
import { describe, expect, test } from "vitest"

import betterAuthComponent from "@convex-dev/better-auth/test"

import schema from "./schema"
import * as seed from "./seed"

const app = defineTestApp({ schema, components: { betterAuth: betterAuthComponent } })
const { internal, createTest } = app.defineModules({ seed })

describe("preview seed", () => {
    test("first run creates the baseline and a rerun returns the same dataset", async () => {
        const t = createTest()

        const first = await t.mutation(internal.seed.previewBaseline, {})

        expect(first.users.map((user) => user.email)).toEqual([
            "preview-owner@example.com",
            "preview-friend@example.com",
        ])
        const [ownerId, friendId] = first.users.map((user) => user.authUserId)
        expect(ownerId).not.toBe(friendId)

        expect(first.restaurants.map((place) => place.slug)).toEqual([
            "midnight-ramen",
            "verde-taqueria",
            "crumb-coffee",
        ])

        expect(first.group.name).toBe("Preview dinner club")
        expect(first.group.memberAuthUserIds).toHaveLength(2)
        expect(first.group.memberAuthUserIds).toEqual(expect.arrayContaining([ownerId, friendId]))

        const second = await t.mutation(internal.seed.previewBaseline, {})
        expect(second).toEqual(first)
    })
})
