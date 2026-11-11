import { describe, expect, test } from "vitest"

import { badgeMeta } from "./badge"
import { buttonMeta } from "./button"
import { iconButtonMeta } from "./icon-button"
import { designSystemSections, type SectionEntry } from "./registry"

function componentEntries(): ReadonlyArray<SectionEntry> {
    return Object.values(designSystemSections).filter((entry) => entry.meta.group === "Components")
}

function jobOf(entry: SectionEntry): string {
    if (entry.meta.guidance === undefined) {
        return ""
    }
    return entry.meta.guidance.whenToUse
}

function misuseOf(entry: SectionEntry): string {
    if (entry.meta.guidance?.whenToAvoid === undefined) {
        return ""
    }
    return entry.meta.guidance.whenToAvoid
}

function siblingsOf(entry: SectionEntry): ReadonlyArray<{ readonly id: string; readonly reason: string }> {
    if (entry.meta.guidance?.siblings === undefined) {
        return []
    }
    return entry.meta.guidance.siblings
}

describe("design-system guidance", () => {
    test("every Components entry states its job and its misuse", () => {
        const entries = componentEntries()
        expect(entries.length).toBeGreaterThan(0)
        expect(entries.map(jobOf).every((text) => text.length > 0)).toBe(true)
        expect(entries.map(misuseOf).every((text) => text.length > 0)).toBe(true)
    })

    test("every Components entry maps its siblings", () => {
        const entries = componentEntries()
        expect(entries.length).toBeGreaterThan(0)
        for (const entry of entries) {
            const siblings = siblingsOf(entry)
            expect(siblings.length).toBeGreaterThan(0)
            for (const sibling of siblings) {
                expect(sibling.id.length).toBeGreaterThan(0)
                expect(sibling.reason.length).toBeGreaterThan(0)
                expect(designSystemSections[sibling.id]).toBeDefined()
            }
        }
    })

    test("button guidance sends button-styled navigation to ButtonLink", () => {
        const guidance = `${buttonMeta.guidance.whenToUse} ${buttonMeta.guidance.whenToAvoid}`
        expect(guidance).toContain("ButtonLink")
    })

    test("badge guidance picks meaning through tone instead of custom classes", () => {
        const guidance = `${badgeMeta.guidance.whenToUse} ${badgeMeta.guidance.whenToAvoid}`
        expect(guidance).toContain("tone")
    })

    test("icon-button guidance keeps unexplained actions on Button with a visible label", () => {
        const guidance = `${iconButtonMeta.guidance.whenToUse} ${iconButtonMeta.guidance.whenToAvoid}`
        expect(guidance).toContain("visible text")
    })
})
