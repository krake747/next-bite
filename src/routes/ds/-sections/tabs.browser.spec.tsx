import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { TabsDemo, tabsMeta } from "./tabs"

describe("Tabs design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(tabsMeta.importPath).toBe("src/ui/tabs.tsx")
        expect(tabsMeta.props.map((prop) => prop.name)).toStrictEqual([
            "defaultValue",
            "value",
            "onValueChange",
            "disabled",
        ])
        expect(tabsMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("switches panels between peer views", async () => {
        const screen = await render(<TabsDemo />)
        await expect.element(screen.getByText(/New spots your friends/)).toBeInTheDocument()
        await screen.getByRole("tab", { name: "Saved" }).click()
        await expect.element(screen.getByText(/Every place you marked/)).toBeInTheDocument()
    })
})
