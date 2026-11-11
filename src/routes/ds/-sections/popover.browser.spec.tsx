import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { PopoverDemo, popoverMeta } from "./popover"
import { expectSectionMeta } from "./section-spec"

describe("Popover design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(popoverMeta, {
            importPath: "src/ui/popover.tsx",
            props: ["tone", "sideOffset", "open"],
        })
        expect(popoverMeta.id).toBe("popover")
    })

    test("opens the panel from the trigger", async () => {
        const screen = await render(<PopoverDemo />)
        await screen.getByRole("button", { name: "Opening hours" }).click()
        await expect.element(screen.getByText("Osteria Nove")).toBeInTheDocument()
    })
})
