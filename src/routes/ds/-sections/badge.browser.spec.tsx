import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { BadgeDemo, badgeMeta } from "./badge"

describe("Badge design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(badgeMeta.importPath).toBe("src/ui/badge.tsx")
        expect(badgeMeta.props.map((prop) => prop.name)).toStrictEqual(["tone", "children", "className"])
        expect(badgeMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders every tone", async () => {
        const screen = await render(<BadgeDemo />)
        for (const label of ["Saved", "Want to try", "Been there", "New", "12 spots"]) {
            await expect.element(screen.getByText(label)).toBeInTheDocument()
        }
    })
})
