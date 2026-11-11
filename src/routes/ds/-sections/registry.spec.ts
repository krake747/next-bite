import { describe, expect, test } from "vitest"

import { designSystemSections, sectionGroups } from "./registry"

const uiModules = import.meta.glob("../../../ui/*.tsx")

function primitiveIds(): ReadonlyArray<string> {
    return Object.keys(uiModules)
        .map((path) => path.split("/").pop() ?? "")
        .filter((file) => file.endsWith(".tsx") && !file.includes(".spec.") && !file.includes(".variants."))
        .map((file) => file.replace(/\.tsx$/, ""))
        .toSorted()
}

function componentEntries() {
    return Object.values(designSystemSections).filter((entry) => entry.meta.group === "Components")
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

    test("every Components entry points at its primitive file", () => {
        const mismatched = componentEntries()
            .map((entry) => entry.meta.importPath)
            .filter((importPath) => !primitiveIds().some((id) => importPath === `src/ui/${id}.tsx`))
        expect(mismatched).toStrictEqual([])
    })

    test("every Components entry documents props with a live demo", () => {
        const components = componentEntries()
        expect(components.map((entry) => typeof entry.meta.props?.length).every((type) => type === "number")).toBe(true)
        expect(components.map((entry) => typeof entry.Demo)).toStrictEqual(components.map(() => "function"))
    })

    test("every Components entry documents guidance", () => {
        const components = componentEntries()
        expect(
            components.map((entry) => typeof entry.meta.guidance?.whenToUse).every((type) => type === "string"),
        ).toBe(true)
    })

    test("lists Components between Tokens and Patterns", () => {
        expect(sectionGroups).toStrictEqual(["Tokens", "Components", "Patterns"])
    })
})
