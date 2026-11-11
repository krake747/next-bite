import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { TooltipDemo, tooltipMeta } from "./tooltip"

describe("Tooltip design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(tooltipMeta.importPath).toBe("src/ui/tooltip.tsx")
        expect(tooltipMeta.props.map((prop) => prop.name)).toStrictEqual(["delay", "side", "sideOffset"])
        expect(tooltipMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("shows the tip on hover", async () => {
        const screen = await render(<TooltipDemo />)
        await screen.getByRole("button", { name: "Invite friends" }).hover()
        await expect.element(screen.getByText("Copy a link your friends can join with")).toBeInTheDocument()
    })
})
