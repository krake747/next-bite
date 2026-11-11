import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { ButtonDemo, buttonMeta } from "./button"

describe("Button design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(buttonMeta.importPath).toBe("src/ui/button.tsx")
        expect(buttonMeta.props.map((prop) => prop.name)).toStrictEqual(["tone", "size", "disabled", "render"])
        expect(buttonMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders every tone and size", async () => {
        const screen = await render(<ButtonDemo />)
        for (const label of ["Primary", "Secondary", "Outline", "Ghost", "Delete", "Small", "Medium", "Large"]) {
            await expect.element(screen.getByRole("button", { name: label })).toBeInTheDocument()
        }
        await expect.element(screen.getByRole("button", { name: "Saving" })).toBeDisabled()
    })
})
