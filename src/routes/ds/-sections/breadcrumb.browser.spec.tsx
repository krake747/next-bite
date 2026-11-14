import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { BreadcrumbDemo, breadcrumbMeta } from "./breadcrumb"
import { expectSectionMeta } from "./section-spec"

describe("Breadcrumb design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(breadcrumbMeta, {
            importPath: "src/ui/breadcrumb.tsx",
            props: ["render", "className"],
        })
        expect(breadcrumbMeta.id).toBe("breadcrumb")
    })

    test("renders parent link and current page", async () => {
        const screen = await render(<BreadcrumbDemo />)
        await expect.element(screen.getByRole("navigation", { name: "breadcrumb" })).toBeInTheDocument()
        await expect.element(screen.getByRole("link", { name: "Restaurants" })).toBeInTheDocument()
        await expect.element(screen.getByText("Five Guys")).toBeInTheDocument()
    })
})
