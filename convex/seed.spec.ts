/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { register as registerBetterAuthComponent } from "@convex-dev/better-auth/test"

import { internal } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

describe("preview seed", () => {
    test("first run creates the baseline and a rerun returns the same dataset", async () => {
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")

        const first = await t.mutation(internal.seed.previewBaseline, {})

        expect(first.users.map((user) => user.email)).toEqual([
            "preview-owner@example.com",
            "preview-friend@example.com",
        ])
        const [ownerId, friendId] = first.users.map((user) => user.profileId)
        expect(ownerId).not.toBe(friendId)

        expect(first.restaurants.map((place) => place.slug)).toEqual([
            "midnight-ramen",
            "verde-taqueria",
            "crumb-coffee",
        ])

        expect(first.group.name).toBe("Preview dinner club")
        expect(first.group.memberProfileIds).toHaveLength(2)
        expect(first.group.memberProfileIds).toEqual(expect.arrayContaining([ownerId, friendId]))

        const second = await t.mutation(internal.seed.previewBaseline, {})
        expect(second).toEqual(first)
    })
})
