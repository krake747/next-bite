import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { PopoverDemo, popoverMeta } from "./popover"

describe("Popover design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(popoverMeta.importPath).toBe("src/ui/popover.tsx")
        expect(popoverMeta.props.map((prop) => prop.name)).toStrictEqual(["tone", "sideOffset", "open"])
        expect(popoverMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("opens the panel from the trigger", async () => {
        const screen = await render(<PopoverDemo />)
        await screen.getByRole("button", { name: "Opening hours" }).click()
        await expect.element(screen.getByText("Osteria Nove")).toBeInTheDocument()
    })
})
