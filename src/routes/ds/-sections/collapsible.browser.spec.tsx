import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { CollapsibleDemo, collapsibleMeta } from "./collapsible"

describe("Collapsible design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(collapsibleMeta.importPath).toBe("src/ui/collapsible.tsx")
        expect(collapsibleMeta.props.map((prop) => prop.name)).toStrictEqual(["defaultOpen", "open", "onOpenChange"])
        expect(collapsibleMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("toggles the panel from the trigger", async () => {
        const screen = await render(<CollapsibleDemo />)
        await screen.getByRole("button", { name: "Show details" }).click()
        await expect.element(screen.getByText(/The kitchen closes at ten/)).toBeInTheDocument()
    })
})
