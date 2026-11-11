import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { DropdownMenuDemo, dropdownMenuMeta } from "./dropdown-menu"
import { expectSectionMeta } from "./section-spec"

describe("Dropdown menu design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(dropdownMenuMeta, {
            importPath: "src/ui/dropdown-menu.tsx",
            props: ["variant", "active", "sideOffset"],
        })
        expect(dropdownMenuMeta.id).toBe("dropdown-menu")
    })

    test("opens the actions from the trigger", async () => {
        const screen = await render(<DropdownMenuDemo />)
        await screen.getByRole("button", { name: "Group actions" }).click()
        await expect.element(screen.getByRole("menuitem", { name: "Rename group" })).toBeInTheDocument()
        await expect.element(screen.getByRole("menuitem", { name: "Leave group" })).toBeInTheDocument()
    })
})
