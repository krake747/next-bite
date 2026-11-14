import { describe, expect, test } from "vitest"

import { coreHookBindings, isEffectHookCall, wholeObjectHookBinding } from "./rule-helpers.js"

function importOf(source: string, locals: ReadonlyArray<{ imported: string; local: string }>) {
    return {
        type: "ImportDeclaration",
        source: { value: source },
        specifiers: locals.map(({ imported, local }) => ({
            type: "ImportSpecifier",
            imported: { type: "Identifier", name: imported },
            local: { type: "Identifier", name: local },
        })),
    }
}

function declarator(id: unknown, callee: string) {
    return {
        type: "VariableDeclarator",
        id,
        init: { type: "CallExpression", callee: { type: "Identifier", name: callee }, arguments: [] },
    }
}

const identifier = (name: string) => ({ type: "Identifier", name })

describe("coreHookBindings", () => {
    test("collects use* locals from @core imports", () => {
        expect(
            coreHookBindings(
                importOf("@core/restaurants", [
                    { imported: "usePlaceDetails", local: "usePlaceDetails" },
                    { imported: "toId", local: "toId" },
                ]),
            ),
        ).toEqual([{ local: "usePlaceDetails", imported: "usePlaceDetails" }])
    })

    test("respects import aliases and ignores other sources", () => {
        expect(
            coreHookBindings(
                importOf("@core/restaurants", [{ imported: "usePlaceDetails", local: "fetchDetailsHook" }]),
            ),
        ).toEqual([{ local: "fetchDetailsHook", imported: "usePlaceDetails" }])
        expect(
            coreHookBindings(importOf("@api/convex.context", [{ imported: "useAction", local: "useAction" }])),
        ).toEqual([])
    })
})

describe("wholeObjectHookBinding", () => {
    const hooks = new Set(["usePlaceDetails"])
    const stable = new Set(["usePlaceLocation"])

    test("tracks whole-object bindings only", () => {
        expect(
            wholeObjectHookBinding(declarator(identifier("fetchDetails"), "usePlaceDetails"), hooks, stable),
        ).toEqual({
            name: "fetchDetails",
            hook: "usePlaceDetails",
        })
        expect(
            wholeObjectHookBinding(
                {
                    type: "VariableDeclarator",
                    id: { type: "ObjectPattern" },
                    init: {
                        type: "CallExpression",
                        callee: { type: "Identifier", name: "usePlaceDetails" },
                        arguments: [],
                    },
                },
                hooks,
                stable,
            ),
        ).toBeNull()
        expect(wholeObjectHookBinding(declarator(identifier("other"), "useSomethingElse"), hooks, stable)).toBeNull()
        expect(
            wholeObjectHookBinding(
                declarator(identifier("fetchLocation"), "usePlaceLocation"),
                new Set(["usePlaceLocation"]),
                new Set(["usePlaceLocation"]),
            ),
        ).toBeNull()
    })
})

describe("isEffectHookCall", () => {
    test("matches effect and memo hooks only", () => {
        const callOf = (name: unknown) => ({ type: "CallExpression", callee: name, arguments: [] })
        expect(isEffectHookCall(callOf({ type: "Identifier", name: "useEffect" }))).toBe(true)
        expect(isEffectHookCall(callOf({ type: "Identifier", name: "useMemo" }))).toBe(true)
        expect(isEffectHookCall(callOf({ type: "Identifier", name: "console.log" }))).toBe(false)
    })
})
