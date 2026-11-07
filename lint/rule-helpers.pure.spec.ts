import { describe, expect, test } from "vitest"

import {
    configArgumentSetsTimeout,
    expectedIconName,
    findImportVariable,
    isExemptIconImport,
    isIconNameTaken,
    isImportMetaEnvRead,
    isPhosphorIconImport,
    isViSetConfigCall,
    reportPhosphorSpecifiers,
    reportReactTypeImports,
    suffixFixes,
} from "./rule-helpers.js"

type ReportDescriptor = {
    readonly messageId?: string
    readonly data?: unknown
    readonly node?: unknown
}

describe("reportReactTypeImports", () => {
    test("reports type-only specifiers from react", () => {
        const reported: ReportDescriptor[] = []
        const context = { report: (descriptor: ReportDescriptor) => reported.push(descriptor) }
        reportReactTypeImports(context, {
            type: "ImportDeclaration",
            source: { type: "Literal", value: "react" },
            specifiers: [
                { type: "ImportSpecifier", importKind: "type", local: { type: "Identifier", name: "FC" } },
                { type: "ImportSpecifier", local: { type: "Identifier", name: "use" } },
            ],
        })
        expect(reported).toHaveLength(1)
        expect(reported[0].messageId).toBe("unexpected")
        expect(reported[0].data).toEqual({ name: "FC" })
    })

    test("reports nothing for value imports", () => {
        const reported: ReportDescriptor[] = []
        const context = { report: (descriptor: ReportDescriptor) => reported.push(descriptor) }
        reportReactTypeImports(context, {
            type: "ImportDeclaration",
            source: { type: "Literal", value: "react" },
            specifiers: [{ type: "ImportSpecifier", local: { type: "Identifier", name: "use" } }],
        })
        expect(reported).toHaveLength(0)
    })
})

describe("reportPhosphorSpecifiers", () => {
    test("delegates each specifier", () => {
        const reported: ReportDescriptor[] = []
        const context = { report: (descriptor: ReportDescriptor) => reported.push(descriptor) }
        const sourceCode = { scopeManager: { globalScope: { variables: [], childScopes: [] } } }
        reportPhosphorSpecifiers(context, sourceCode, {
            type: "ImportDeclaration",
            specifiers: [
                {
                    type: "ImportSpecifier",
                    imported: { type: "Identifier", name: "House" },
                    local: { type: "Identifier", name: "House" },
                },
            ],
        })
        expect(reported).toHaveLength(1)
        expect(reported[0].messageId).toBe("missingSuffix")
    })
})

describe("isPhosphorIconImport", () => {
    test("matches value imports from the phosphor package", () => {
        expect(
            isPhosphorIconImport({
                type: "ImportDeclaration",
                source: { type: "Literal", value: "@phosphor-icons/react" },
            }),
        ).toBe(true)
    })

    test("rejects type imports and other packages", () => {
        expect(
            isPhosphorIconImport({
                type: "ImportDeclaration",
                source: { type: "Literal", value: "@phosphor-icons/react" },
                importKind: "type",
            }),
        ).toBe(false)
        expect(isPhosphorIconImport({ type: "ImportDeclaration", source: { type: "Literal", value: "react" } })).toBe(
            false,
        )
    })
})

describe("isImportMetaEnvRead", () => {
    test("matches import.meta.env", () => {
        expect(
            isImportMetaEnvRead({
                type: "MemberExpression",
                object: {
                    type: "MetaProperty",
                    meta: { type: "Identifier", name: "import" },
                    property: { type: "Identifier", name: "meta" },
                },
                property: { type: "Identifier", name: "env" },
            }),
        ).toBe(true)
    })

    test("rejects other member shapes", () => {
        expect(
            isImportMetaEnvRead({
                type: "MemberExpression",
                object: { type: "Identifier", name: "import" },
                property: { type: "Identifier", name: "env" },
            }),
        ).toBe(false)
        expect(
            isImportMetaEnvRead({
                type: "MemberExpression",
                object: {
                    type: "MetaProperty",
                    meta: { type: "Identifier", name: "import" },
                    property: { type: "Identifier", name: "meta" },
                },
                property: { type: "Identifier", name: "url" },
            }),
        ).toBe(false)
    })
})

function identifier(name: string): { type: "Identifier"; name: string } {
    return { type: "Identifier", name }
}

describe("isExemptIconImport", () => {
    test("exempts the base icon types", () => {
        for (const name of ["Icon", "IconProps", "IconWeight", "IconContext", "IconBase"]) {
            expect(isExemptIconImport(name)).toBe(true)
        }
    })

    test("flags real icons, suffixed or not", () => {
        expect(isExemptIconImport("House")).toBe(false)
        expect(isExemptIconImport("HouseIcon")).toBe(false)
    })
})

describe("expectedIconName", () => {
    test("appends the Icon suffix", () => {
        expect(expectedIconName("House")).toBe("HouseIcon")
    })
})

describe("findImportVariable", () => {
    test("finds the variable whose definition holds the specifier", () => {
        const specifier = { type: "ImportSpecifier" }
        const variable = { defs: [{ node: specifier }] }
        const scopeManager = {
            globalScope: {
                variables: [{ defs: [{ node: {} }] }],
                childScopes: [{ variables: [variable], childScopes: [] }],
            },
        }
        expect(findImportVariable(scopeManager, specifier)).toBe(variable)
    })

    test("returns null when no definition holds the specifier", () => {
        const scopeManager = { globalScope: { variables: [], childScopes: [] } }
        expect(findImportVariable(scopeManager, { type: "ImportSpecifier" })).toBe(null)
    })
})

describe("isIconNameTaken", () => {
    test("reports a sibling variable holding the expected name", () => {
        const variable = { name: "House", scope: { variables: [] } }
        const taken = { name: "HouseIcon", scope: { variables: [] } }
        variable.scope.variables = [variable, taken]
        expect(isIconNameTaken(variable, "HouseIcon")).toBe(true)
    })

    test("ignores the variable itself", () => {
        const variable = { name: "HouseIcon", scope: { variables: [] } }
        variable.scope.variables = [variable]
        expect(isIconNameTaken(variable, "HouseIcon")).toBe(false)
    })
})

describe("suffixFixes", () => {
    const fixer = { replaceText: (node: unknown, text: string) => ({ node, text }) }

    test("replaces the whole specifier for a plain import without scope info", () => {
        const specifier = { type: "ImportSpecifier", local: identifier("House") }
        expect(suffixFixes(fixer, specifier, null, "House", "House", "HouseIcon")).toEqual([
            { node: specifier, text: "HouseIcon" },
        ])
    })

    test("replaces only the local name for an aliased import without scope info", () => {
        const local = identifier("H")
        const specifier = { type: "ImportSpecifier", local }
        expect(suffixFixes(fixer, specifier, null, "H", "House", "HouseIcon")).toEqual([
            { node: local, text: "HouseIcon" },
        ])
    })

    test("returns null when the expected name is taken", () => {
        const specifier = { type: "ImportSpecifier", local: identifier("House") }
        const variable = { name: "House", scope: { variables: [{ name: "HouseIcon" }] }, references: [] }
        expect(suffixFixes(fixer, specifier, variable, "House", "House", "HouseIcon")).toBe(null)
    })

    test("renames matching references for a plain import", () => {
        const specifier = { type: "ImportSpecifier", local: identifier("House") }
        const reference = { identifier: identifier("House") }
        const other = { identifier: identifier("Other") }
        const variable = { name: "House", scope: { variables: [] }, references: [reference, other] }
        variable.scope.variables = [variable]
        expect(suffixFixes(fixer, specifier, variable, "House", "House", "HouseIcon")).toEqual([
            { node: specifier, text: "HouseIcon" },
            { node: reference.identifier, text: "HouseIcon" },
        ])
    })
})

describe("isViSetConfigCall", () => {
    test("matches a direct vi.setConfig call", () => {
        expect(
            isViSetConfigCall({
                type: "CallExpression",
                callee: {
                    type: "MemberExpression",
                    computed: false,
                    object: identifier("vi"),
                    property: identifier("setConfig"),
                },
            }),
        ).toBe(true)
    })

    test("rejects computed, foreign, and plain calls", () => {
        const member = (
            object: { type: string; name: string },
            property: { type: string; name: string },
            computed: boolean,
        ) => ({
            type: "CallExpression",
            callee: { type: "MemberExpression", computed, object, property },
        })
        expect(isViSetConfigCall(member(identifier("vi"), identifier("setConfig"), true))).toBe(false)
        expect(isViSetConfigCall(member(identifier("vitest"), identifier("setConfig"), false))).toBe(false)
        expect(isViSetConfigCall(member(identifier("vi"), identifier("configure"), false))).toBe(false)
        expect(isViSetConfigCall({ type: "CallExpression", callee: identifier("run") })).toBe(false)
    })
})

describe("configArgumentSetsTimeout", () => {
    test("spots identifier and literal testTimeout keys", () => {
        const withKeys = (key: { type: string; name?: string; value?: unknown }) => ({
            type: "ObjectExpression",
            properties: [{ type: "Property", key }],
        })
        expect(configArgumentSetsTimeout(withKeys(identifier("testTimeout")))).toBe(true)
        expect(configArgumentSetsTimeout(withKeys({ type: "Literal", value: "testTimeout" }))).toBe(true)
        expect(configArgumentSetsTimeout(withKeys(identifier("slowTestThreshold")))).toBe(false)
    })

    test("rejects spread properties and non-objects", () => {
        expect(
            configArgumentSetsTimeout({
                type: "ObjectExpression",
                properties: [{ type: "SpreadElement" }],
            }),
        ).toBe(false)
        expect(configArgumentSetsTimeout({ type: "Identifier", name: "config" })).toBe(false)
    })
})
