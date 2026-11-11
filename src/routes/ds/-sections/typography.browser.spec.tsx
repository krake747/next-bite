import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { readThemeTokens } from "./theme-tokens"
import { TypographyDemo, typographyMeta, typographyTokenRows } from "./typography"

describe("Typography design-system section", () => {
    test("documents typography with props, anatomy and guidance", () => {
        expectSectionMeta(typographyMeta, {
            importPath: "src/index.css",
            props: ["font-display", "text-body / text-sm / text-xs"],
        })
        expect(typographyMeta.anatomy?.length).toBeGreaterThan(0)
        expect(typographyMeta.guidance?.whenToAvoid?.length).toBeGreaterThan(0)
    })

    test("type table renders values from the theme source", async () => {
        const screen = await render(<TypographyDemo />)
        const rows = typographyTokenRows()
        expect(rows.length).toBe(4)
        expect(rows.map((row) => row.token)).toStrictEqual(["font-display", "text-body", "text-sm", "text-xs"])
        const tokens = readThemeTokens()
        expect(tokens.get("font-display")).toBe('"Bricolage Grotesque Variable", system-ui, sans-serif')
        expect(tokens.get("font-sans")).toBe('"DM Sans Variable", system-ui, sans-serif')
        expect(new Set(rows.map((row) => row.value)).size).toBe(2)
        for (const row of rows) {
            expect(row.value).not.toBe("")
            await expect.element(screen.getByRole("cell", { name: row.token, exact: true })).toBeInTheDocument()
        }
        for (const value of new Set(rows.map((row) => row.value))) {
            expect(screen.container.textContent).toContain(value)
        }
    })
})
