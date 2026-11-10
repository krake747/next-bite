import { QueryClient } from "@tanstack/react-query"
import { describe, expect, test, vi } from "vitest"

import { toId } from "@api/data.model"
import { api } from "@api/endpoints"

import { convexQueryOptions, warmQueries, warmQueriesWithin } from "./convex.options"

describe("convexQueryOptions", () => {
    test("marks skipped queries so the connector never subscribes them", () => {
        const skipped = convexQueryOptions(api.plans.listPlansForGroup, undefined, { skip: true })
        expect(skipped.queryKey[0]).toBe("convexQuery")
        expect(skipped.queryKey[2]).toBe("skip")
    })

    test("keeps real args on the key when not skipping", () => {
        const groupId = toId<"groups">("jg123")
        const withArgs = convexQueryOptions(api.plans.listPlansForGroup, { groupId })
        expect(withArgs.queryKey[2]).toEqual({ groupId })

        const withoutArgs = convexQueryOptions(api.plans.listPlansForGroup, undefined)
        expect(withoutArgs.queryKey[2]).toEqual({})
    })
})

describe("warmQueries", () => {
    test("skips warming when no query function is available", () => {
        const client = new QueryClient()
        const query = vi.spyOn(client, "query")

        warmQueries(client, [convexQueryOptions(api.landing.getStats)])

        expect(query).not.toHaveBeenCalled()
    })

    test("warms when a default query function exists", () => {
        // oxlint-disable-next-line typescript/require-await -- test resolver intentionally performs no async work
        const client = new QueryClient({ defaultOptions: { queries: { queryFn: async () => "warm" } } })
        const query = vi.spyOn(client, "query")

        warmQueries(client, [convexQueryOptions(api.landing.getStats)])

        expect(query).toHaveBeenCalledTimes(1)
    })
})

describe("warmQueriesWithin", () => {
    test("resolves with the data cached when the query settles inside the budget", async () => {
        // oxlint-disable-next-line typescript/require-await -- test resolver intentionally performs no async work
        const client = new QueryClient({ defaultOptions: { queries: { queryFn: async () => "warm" } } })
        const stats = convexQueryOptions(api.landing.getStats)

        await warmQueriesWithin(client, [stats], 1000)

        expect(client.getQueryData(stats.queryKey)).toBe("warm")
    })

    test("stops waiting at the budget when the query is slow", async () => {
        const never = new Promise<string>(() => {})
        const client = new QueryClient({ defaultOptions: { queries: { queryFn: async () => never } } })
        const stats = convexQueryOptions(api.landing.getStats)
        const started = Date.now()

        await warmQueriesWithin(client, [stats], 50)

        expect(Date.now() - started).toBeLessThan(1000)
        expect(client.getQueryData(stats.queryKey)).toBeUndefined()
    })
})
