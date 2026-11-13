import { describe, expect, test } from "vitest"

import { designSystemSections, sectionGroups, sectionIcons } from "./registry"

const uiTsxModules = import.meta.glob("../../../ui/*.tsx")
const uiTsModules = import.meta.glob("../../../ui/*.ts")
const uiHookModules = import.meta.glob("../../../ui/hooks/*.ts")

const exemptUiModules: Readonly<Record<string, string>> = {
    "cva.config": "cva setup, no component",
    variants: "shared cva styles, no component",
    "css-vars": "style helper, no component",
    "sidebar.context": "context and constants, component lives in sidebar.tsx",
}

const exemptVariantModules: Readonly<Record<string, string>> = {
    "avatar.variants": "variant definitions for avatar.tsx",
    "badge.variants": "variant definitions for badge.tsx",
    "button.variants": "variant definitions for button.tsx",
    "icon-button.variants": "variant definitions for icon-button.tsx",
    "popover.variants": "variant definitions for popover.tsx",
}

function primitiveIds(): ReadonlyArray<string> {
    return Object.keys(uiTsxModules)
        .map((path) => path.split("/").pop() ?? "")
        .filter((file) => file.endsWith(".tsx") && !file.includes(".spec.") && !file.includes(".variants."))
        .map((file) => file.replace(/\.tsx$/, ""))
        .toSorted()
}

function tsModuleNames(): ReadonlyArray<string> {
    return Object.keys(uiTsModules)
        .map((path) => path.split("/").pop() ?? "")
        .filter((file) => file.endsWith(".ts") && !file.includes(".spec.") && !file.includes(".variants."))
        .map((file) => file.replace(/\.ts$/, ""))
        .toSorted()
}

function variantModuleNames(): ReadonlyArray<string> {
    return Object.keys(uiTsModules)
        .map((path) => path.split("/").pop() ?? "")
        .filter((file) => file.endsWith(".variants.ts"))
        .map((file) => file.replace(/\.ts$/, ""))
        .toSorted()
}

function hookModuleNames(): ReadonlyArray<string> {
    return Object.keys(uiHookModules)
        .map((path) => path.split("/").pop() ?? "")
        .filter((file) => file.endsWith(".ts") && !file.includes(".spec."))
        .map((file) => file.replace(/\.ts$/, ""))
        .toSorted()
}

function componentEntries() {
    return Object.values(designSystemSections).filter((entry) => entry.meta.group === "Components")
}

function patternEntries() {
    return Object.values(designSystemSections).filter((entry) => entry.meta.group === "Patterns")
}

describe("design-system registry", () => {
    test("covers every src/ui primitive with a Components section", () => {
        const expected = primitiveIds()
        expect(expected.length).toBeGreaterThan(0)
        const covered = componentEntries()
            .map((entry) => entry.meta.id)
            .toSorted()
        expect(covered).toStrictEqual(expected)
    })

    test("documents every non-component ui module as an explicit exemption", () => {
        expect(tsModuleNames().toSorted()).toStrictEqual(Object.keys(exemptUiModules).toSorted())
        for (const [name, reason] of Object.entries(exemptUiModules)) {
            expect(reason.length).toBeGreaterThan(0)
            expect(name.length).toBeGreaterThan(0)
        }
        expect(tsModuleNames()).toContain("css-vars")
        expect(hookModuleNames()).toStrictEqual(["use-media-query"])
    })

    test("documents variant modules as exemptions, not components", () => {
        expect(variantModuleNames()).toStrictEqual(Object.keys(exemptVariantModules).toSorted())
    })

    test("every Components entry points at its primitive file", () => {
        const mismatched = componentEntries()
            .map((entry) => entry.meta.importPath)
            .filter((importPath) => !primitiveIds().some((id) => importPath === `src/ui/${id}.tsx`))
        expect(mismatched).toStrictEqual([])
    })

    test("every Components entry documents props with a live demo", () => {
        const components = componentEntries()
        expect(components.length).toBeGreaterThan(0)
        for (const entry of components) {
            expect(entry.meta.props?.length).toBeGreaterThan(0)
            expect(entry.meta.anatomy?.length).toBeGreaterThan(0)
            expect(typeof entry.Demo).toBe("function")
        }
    })

    test("every Components entry documents guidance", () => {
        const components = componentEntries()
        for (const entry of components) {
            expect(entry.meta.guidance?.whenToUse.length).toBeGreaterThan(0)
            expect(entry.meta.guidance?.whenToAvoid?.length).toBeGreaterThan(0)
            expect(entry.meta.guidance?.siblings?.length).toBeGreaterThan(0)
        }
    })

    test("maps every section to a nav icon", () => {
        for (const entry of Object.values(designSystemSections)) {
            expect(sectionIcons[entry.meta.id]).toBeDefined()
        }
    })

    test("lists Components between Tokens and Patterns", () => {
        expect(sectionGroups).toStrictEqual(["Tokens", "Components", "Patterns"])
    })

    test("covers every documented pattern piece with a Patterns section", () => {
        const covered = patternEntries()
            .map((entry) => entry.meta.id)
            .toSorted()
        expect(covered).toStrictEqual(["empty-state", "loading", "query-error", "social-metadata"])
    })

    test("every Patterns entry points at its pattern file", () => {
        const mismatched = patternEntries()
            .map((entry) => entry.meta.importPath)
            .filter((importPath) => !/^src\/pattern\/[^/]+\.tsx$/.test(importPath))
        expect(mismatched).toStrictEqual([])
    })

    test("every Patterns entry documents do and dont guidance with a live demo", () => {
        const patterns = patternEntries()
        expect(patterns.map((entry) => typeof entry.meta.guidance?.whenToUse).every((type) => type === "string")).toBe(
            true,
        )
        expect(
            patterns.map((entry) => typeof entry.meta.guidance?.whenToAvoid).every((type) => type === "string"),
        ).toBe(true)
        expect(patterns.map((entry) => typeof entry.Demo)).toStrictEqual(patterns.map(() => "function"))
    })
})
