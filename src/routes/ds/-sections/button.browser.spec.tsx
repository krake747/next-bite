import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { ButtonDemo, buttonMeta } from "./button"
import { expectSectionMeta } from "./section-spec"

describe("Button design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(buttonMeta, {
            importPath: "src/ui/button.tsx",
            props: ["tone", "size", "disabled", "render"],
        })
        expect(buttonMeta.id).toBe("button")
    })

    test("renders every tone and size", async () => {
        const screen = await render(<ButtonDemo />)
        for (const label of ["Primary", "Secondary", "Outline", "Ghost", "Delete", "Small", "Medium", "Large"]) {
            await expect.element(screen.getByRole("button", { name: label })).toBeInTheDocument()
        }
        await expect.element(screen.getByRole("button", { name: "Saving" })).toBeDisabled()
    })
})
