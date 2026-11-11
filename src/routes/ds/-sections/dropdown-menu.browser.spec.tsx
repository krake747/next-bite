import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { DropdownMenuDemo, dropdownMenuMeta } from "./dropdown-menu"

describe("Dropdown menu design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(dropdownMenuMeta.importPath).toBe("src/ui/dropdown-menu.tsx")
        expect(dropdownMenuMeta.props.map((prop) => prop.name)).toStrictEqual(["variant", "active", "sideOffset"])
        expect(dropdownMenuMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("opens the actions from the trigger", async () => {
        const screen = await render(<DropdownMenuDemo />)
        await screen.getByRole("button", { name: "Group actions" }).click()
        await expect.element(screen.getByRole("menuitem", { name: "Rename group" })).toBeInTheDocument()
        await expect.element(screen.getByRole("menuitem", { name: "Leave group" })).toBeInTheDocument()
    })
})
