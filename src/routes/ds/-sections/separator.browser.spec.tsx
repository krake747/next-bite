import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { SeparatorDemo, separatorMeta } from "./separator"

describe("Separator design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(separatorMeta.importPath).toBe("src/ui/separator.tsx")
        expect(separatorMeta.props.map((prop) => prop.name)).toStrictEqual(["orientation"])
        expect(separatorMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders both orientations", async () => {
        const screen = await render(<SeparatorDemo />)
        await expect.element(screen.getByText("Your lists")).toBeInTheDocument()
        const separators = document.querySelectorAll('[data-slot="separator"]')
        expect(separators.length).toBe(3)
    })
})
