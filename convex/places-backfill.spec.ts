/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { register as registerBetterAuthComponent } from "@convex-dev/better-auth/test"

import { internal } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob(["./**/*.ts", "!./**/*.spec.ts"])

describe("stripPlaceCoordinates backfill", () => {
    test("removes stored lat/lng, keeps the place id, and reruns clean", async () => {
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")

        const ownerId = await t.run(async (ctx) => {
            return ctx.db.insert("profiles", {
                authUserId: "legacy-owner",
                name: "Legacy Owner",
                email: "legacy-owner@example.com",
            })
        })

        const legacyId = await t.run(async (ctx) => {
            return ctx.db.insert("places", {
                ownerId,
                name: "Legacy Place",
                address: {
                    label: "Luxembourg City",
                    google: { placeId: "ChIJlegacy", lat: 49.6, lng: 6.13 },
                },
            })
        })
        const currentId = await t.run(async (ctx) => {
            return ctx.db.insert("places", {
                ownerId,
                name: "Current Place",
                address: { label: "Esch", google: { placeId: "ChIJcurrent" } },
            })
        })
        const manualId = await t.run(async (ctx) => {
            return ctx.db.insert("places", {
                ownerId,
                name: "Manual Place",
                address: { label: "Somewhere" },
            })
        })

        const first = await t.mutation(internal.model.places.places.stripPlaceCoordinates, {})
        expect(first).toEqual({ total: 3, migrated: 1 })

        const stripped = await t.run(async (ctx) => ctx.db.get("places", legacyId))
        expect(stripped).toMatchObject({
            name: "Legacy Place",
            address: { label: "Luxembourg City", google: { placeId: "ChIJlegacy" } },
        })
        expect(stripped?.address.google).not.toHaveProperty("lat")
        expect(stripped?.address.google).not.toHaveProperty("lng")

        const untouched = await t.run(async (ctx) => ctx.db.get("places", currentId))
        expect(untouched?.address.google).toEqual({ placeId: "ChIJcurrent" })

        const manual = await t.run(async (ctx) => ctx.db.get("places", manualId))
        expect(manual?.address.google).toBeUndefined()

        const second = await t.mutation(internal.model.places.places.stripPlaceCoordinates, {})
        expect(second).toEqual({ total: 3, migrated: 0 })
    })
})
