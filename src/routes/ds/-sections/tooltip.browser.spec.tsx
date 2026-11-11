import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { TooltipDemo, tooltipMeta } from "./tooltip"

describe("Tooltip design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(tooltipMeta, {
            importPath: "src/ui/tooltip.tsx",
            props: ["delay", "side", "sideOffset"],
        })
        expect(tooltipMeta.id).toBe("tooltip")
    })

    test("shows the tip on hover", async () => {
        const screen = await render(<TooltipDemo />)
        await screen.getByRole("button", { name: "Invite friends" }).hover()
        await expect.element(screen.getByText("Copy a link your friends can join with")).toBeInTheDocument()
    })
})
