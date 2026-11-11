import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { TabsDemo, tabsMeta } from "./tabs"

describe("Tabs design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(tabsMeta, {
            importPath: "src/ui/tabs.tsx",
            props: ["defaultValue", "value", "onValueChange", "disabled"],
        })
        expect(tabsMeta.id).toBe("tabs")
    })

    test("switches panels between peer views", async () => {
        const screen = await render(<TabsDemo />)
        await expect.element(screen.getByText(/New spots your friends/)).toBeInTheDocument()
        await screen.getByRole("tab", { name: "Saved" }).click()
        await expect.element(screen.getByText(/Every place you marked/)).toBeInTheDocument()
    })
})
