import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { ShapeDemo, shapeMeta, shapeTokenRows } from "./shape"
import { readThemeTokens } from "./theme-tokens"

describe("Shape design-system section", () => {
    test("documents shape with props, anatomy and guidance", () => {
        expectSectionMeta(shapeMeta, {
            importPath: "src/index.css",
            props: ["rounded-*", "shadow-*"],
        })
        expect(shapeMeta.anatomy?.length).toBeGreaterThan(0)
        expect(shapeMeta.guidance?.whenToAvoid?.length).toBeGreaterThan(0)
    })

    test("radius table renders values from the theme source", async () => {
        const screen = await render(<ShapeDemo />)
        const rows = shapeTokenRows()
        expect(rows.length).toBe(7)
        expect(rows.map((row) => row.token)).toContain("rounded-card")
        expect(rows.map((row) => row.token)).toContain("shadow-card")
        const tokens = readThemeTokens()
        expect(tokens.get("radius-control")).toBe("0.625rem")
        expect(tokens.get("radius-card")).toBe("1rem")
        for (const row of rows) {
            expect(row.value).not.toBe("")
            await expect.element(screen.getByRole("cell", { name: row.token, exact: true })).toBeInTheDocument()
            await expect.element(screen.getByRole("cell", { name: row.value, exact: true })).toBeInTheDocument()
        }
    })
})
