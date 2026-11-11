import { describe, expect, test } from "vitest"

import schema from "../convex/schema"
import { moduleOfFile, ownershipProblem, readTableOwners, tableAccess } from "./table-owners.js"

const modelDir = "convex/model"

function dbCall(method: string, first?: unknown, receiver: unknown = ctxDb) {
    return {
        type: "CallExpression",
        callee: {
            type: "MemberExpression",
            object: receiver,
            property: { type: "Identifier", name: method },
        },
        arguments: first === undefined ? [] : [first],
    }
}

const ctxDb = {
    type: "MemberExpression",
    object: { type: "Identifier", name: "ctx" },
    property: { type: "Identifier", name: "db" },
}

describe("readTableOwners", () => {
    test("assigns every schema table to exactly the module whose fragment defines it", () => {
        const owners = readTableOwners(modelDir)
        expect(new Set(owners.keys())).toEqual(new Set(Object.keys(schema.tables)))
        expect(owners.get("profiles")).toBe("identity")
        expect(owners.get("friendships")).toBe("social")
        expect(owners.get("groupMembers")).toBe("groups")
        expect(owners.get("places")).toBe("places")
        expect(owners.get("photos")).toBe("places")
        expect(owners.get("saves")).toBe("places")
        expect(owners.get("groupPlaces")).toBe("places")
        expect(owners.get("plans")).toBe("plans")
    })
})

describe("moduleOfFile", () => {
    test("reads the module from a model path", () => {
        expect(moduleOfFile("/repo/convex/model/social/friends.ts")).toBe("social")
        expect(moduleOfFile(String.raw`C:\repo\convex\model\places\feed.ts`)).toBe("places")
    })

    test("returns null outside convex/model", () => {
        expect(moduleOfFile("/repo/convex/social.ts")).toBeNull()
        expect(moduleOfFile("/repo/src/core/social.ts")).toBeNull()
    })
})

describe("tableAccess", () => {
    test("reads a literal table from ctx.db and destructured db calls", () => {
        const literal = { type: "Literal", value: "profiles" }
        expect(tableAccess(dbCall("query", literal))).toMatchObject({ method: "query", table: "profiles" })
        expect(tableAccess(dbCall("patch", literal, { type: "Identifier", name: "db" }))).toMatchObject({
            method: "patch",
            table: "profiles",
        })
    })

    test("flags a non-literal or missing table as dynamic", () => {
        expect(tableAccess(dbCall("get", { type: "Identifier", name: "id" }))).toMatchObject({ table: null })
        expect(tableAccess(dbCall("insert"))).toMatchObject({ method: "insert", table: null })
    })

    test("ignores calls that are not database methods", () => {
        expect(tableAccess(dbCall("normalizeId", { type: "Literal", value: "profiles" }))).toBeNull()
        expect(
            tableAccess(dbCall("get", { type: "Literal", value: "x" }, { type: "Identifier", name: "cache" })),
        ).toBeNull()
        expect(tableAccess({ type: "CallExpression", callee: { type: "Identifier", name: "query" } })).toBeNull()
    })
})

describe("ownershipProblem", () => {
    test("allows own tables, rejects foreign and unowned ones", () => {
        expect(ownershipProblem("social", "social")).toBeNull()
        expect(ownershipProblem("places", "social")).toBe("foreign")
        expect(ownershipProblem(undefined, "social")).toBe("unowned")
    })
})
