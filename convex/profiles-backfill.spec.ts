/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { register as registerBetterAuthComponent } from "@convex-dev/better-auth/test"

import { internal } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob(["./**/*.ts", "!./**/*.spec.ts"])

describe("stripProfilesCreatedAt backfill", () => {
    test("removes the legacy createdAt key and reruns clean", async () => {
        const t = convexTest(schema, modules)
        registerBetterAuthComponent(t, "betterAuth")

        const legacyId = await t.run(async (ctx) => {
            return ctx.db.insert("profiles", {
                authUserId: "legacy-user",
                name: "Legacy",
                email: "legacy@example.com",
                createdAt: 1794396723772,
            })
        })
        const currentId = await t.run(async (ctx) => {
            return ctx.db.insert("profiles", {
                authUserId: "current-user",
                name: "Current",
                email: "current@example.com",
            })
        })

        const first = await t.mutation(internal.model.identity.profiles.stripProfilesCreatedAt, {})
        expect(first).toEqual({ total: 2, migrated: 1 })

        const stripped = await t.run(async (ctx) => ctx.db.get("profiles", legacyId))
        expect(stripped).toMatchObject({ name: "Legacy" })
        expect(stripped).not.toHaveProperty("createdAt")

        const untouched = await t.run(async (ctx) => ctx.db.get("profiles", currentId))
        expect(untouched).toMatchObject({ name: "Current" })

        const second = await t.mutation(internal.model.identity.profiles.stripProfilesCreatedAt, {})
        expect(second).toEqual({ total: 2, migrated: 0 })
    })
})
