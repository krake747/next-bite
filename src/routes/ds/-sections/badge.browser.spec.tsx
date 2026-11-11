import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { BadgeDemo, badgeMeta } from "./badge"
import { expectSectionMeta } from "./section-spec"

describe("Badge design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(badgeMeta, {
            importPath: "src/ui/badge.tsx",
            props: ["tone", "children", "className"],
        })
        expect(badgeMeta.id).toBe("badge")
    })

    test("renders every tone", async () => {
        const screen = await render(<BadgeDemo />)
        for (const label of ["Saved", "Want to try", "Been there", "New", "12 spots"]) {
            await expect.element(screen.getByText(label)).toBeInTheDocument()
        }
    })
})
