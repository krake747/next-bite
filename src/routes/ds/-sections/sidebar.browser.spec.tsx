import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { SidebarDemo, sidebarMeta } from "./sidebar"

describe("Sidebar design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(sidebarMeta, {
            importPath: "src/ui/sidebar.tsx",
            props: ["defaultOpen", "collapsible", "isActive", "tooltip"],
        })
        expect(sidebarMeta.id).toBe("sidebar")
    })

    test("renders the navigation destinations", async () => {
        const screen = await render(<SidebarDemo />)
        for (const label of ["Home", "Places", "Friends"]) {
            await expect.element(screen.getByRole("button", { name: label })).toBeInTheDocument()
        }
    })
})
