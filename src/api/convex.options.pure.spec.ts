import { describe, expect, test } from "vitest"

import { toId } from "@api/data.model"
import { api } from "@api/endpoints"

import { convexQueryOptions } from "./convex.options"

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
