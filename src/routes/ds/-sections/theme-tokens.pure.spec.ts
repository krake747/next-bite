import { readFileSync } from "node:fs"

import { describe, expect, test } from "vitest"

import { parseThemeTokens, readThemeTokens } from "./theme-tokens"

const themeFile = readFileSync(new URL("../../../index.css", import.meta.url), "utf8")

const fixture = `
@theme inline {
    --color-primary: var(--color-tomato-600);
    --font-display: "Bricolage Grotesque Variable", system-ui, sans-serif;
    --radius-card: 1rem;
    --shadow-card:
        0 1px 2px oklch(0.267 0.012 78.07 / 0.05), 0 2px 8px oklch(0.267 0.012 78.07 / 0.05);
}

@utility hit-area {
    --hit-area-t: 0px;
}
`

describe("parseThemeTokens", () => {
    test("reads names and values from the theme block", () => {
        expect(parseThemeTokens(fixture)).toStrictEqual([
            { name: "color-primary", value: "var(--color-tomato-600)" },
            { name: "font-display", value: '"Bricolage Grotesque Variable", system-ui, sans-serif' },
            { name: "radius-card", value: "1rem" },
            {
                name: "shadow-card",
                value: "0 1px 2px oklch(0.267 0.012 78.07 / 0.05), 0 2px 8px oklch(0.267 0.012 78.07 / 0.05)",
            },
        ])
    })

    test("ignores custom properties outside the theme block", () => {
        const names = parseThemeTokens(fixture).map((token) => token.name)
        expect(names).not.toContain("hit-area-t")
    })

    test("merges tokens across split theme blocks", () => {
        const split = `
@theme inline {
    --color-primary: var(--color-tomato-600);
}

@theme inline {
    --radius-card: 1rem;
}
`
        expect(parseThemeTokens(split)).toStrictEqual([
            { name: "color-primary", value: "var(--color-tomato-600)" },
            { name: "radius-card", value: "1rem" },
        ])
    })

    test("stylesheet on disk exposes the documented token groups", () => {
        const tokens = readThemeTokens(themeFile)
        for (const name of ["color-primary", "font-display", "radius-card"]) {
            const value = tokens.get(name)
            expect(value).toBeDefined()
            expect(themeFile).toContain(value!)
        }
    })
})
