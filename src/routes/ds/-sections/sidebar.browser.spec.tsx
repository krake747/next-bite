import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { SidebarDemo, sidebarMeta } from "./sidebar"

describe("Sidebar design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(sidebarMeta.importPath).toBe("src/ui/sidebar.tsx")
        expect(sidebarMeta.props.map((prop) => prop.name)).toStrictEqual([
            "defaultOpen",
            "collapsible",
            "isActive",
            "tooltip",
        ])
        expect(sidebarMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders the navigation destinations", async () => {
        const screen = await render(<SidebarDemo />)
        for (const label of ["Home", "Places", "Friends"]) {
            await expect.element(screen.getByRole("button", { name: label })).toBeInTheDocument()
        }
    })
})
