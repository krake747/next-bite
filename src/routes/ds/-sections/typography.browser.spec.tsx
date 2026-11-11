import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { themeCss } from "./theme-tokens"
import { TypographyDemo, typographyTokenRows } from "./typography"

describe("Typography design-system section", () => {
    test("type table renders values from the theme source", async () => {
        const screen = await render(<TypographyDemo />)
        const rows = typographyTokenRows()
        expect(rows.length).toBeGreaterThan(0)
        for (const row of rows) {
            expect(row.value).not.toBe("")
            expect(themeCss).toContain(row.value)
            await expect.element(screen.getByRole("cell", { name: row.token, exact: true })).toBeInTheDocument()
            await expect.element(screen.getByRole("cell", { name: row.value, exact: true })).toBeInTheDocument()
        }
    })
})
