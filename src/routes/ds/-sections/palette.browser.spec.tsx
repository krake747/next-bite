import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { PaletteDemo, paletteMeta, paletteSwatchFamilies, paletteTokenRows } from "./palette"
import { expectSectionMeta } from "./section-spec"
import { readThemeTokens } from "./theme-tokens"

describe("Palette design-system section", () => {
    test("documents palette with props, anatomy and guidance", () => {
        expectSectionMeta(paletteMeta, {
            importPath: "src/index.css",
            props: ["var(--color-*)", "bg-* / text-*"],
        })
        expect(paletteMeta.anatomy?.length).toBeGreaterThan(0)
        expect(paletteMeta.guidance?.whenToAvoid?.length).toBeGreaterThan(0)
    })

    test("semantic token table renders values from the theme source", async () => {
        const screen = await render(<PaletteDemo />)
        const rows = paletteTokenRows()
        expect(rows.length).toBe(11)
        expect(rows.map((row) => row.token)).toContain("primary")
        const tokens = readThemeTokens()
        expect(tokens.get("color-tomato-600")).toBe("oklch(0.568 0.183 30.85)")
        expect(tokens.get("color-stone-100")).toBe("oklch(0.982 0.015 77.07)")
        const families = paletteSwatchFamilies()
        expect(families.map((family) => family.name)).toStrictEqual(["Tomato", "Stone", "Mango", "Basil"])
        for (const row of rows) {
            expect(row.value).not.toBe("")
            await expect.element(screen.getByRole("cell", { name: row.token, exact: true })).toBeInTheDocument()
            await expect.element(screen.getByRole("cell", { name: row.value, exact: true })).toBeInTheDocument()
        }
    })
})
