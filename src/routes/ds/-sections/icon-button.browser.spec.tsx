import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { IconButtonDemo, iconButtonMeta } from "./icon-button"

describe("Icon button design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(iconButtonMeta.importPath).toBe("src/ui/icon-button.tsx")
        expect(iconButtonMeta.props.map((prop) => prop.name)).toStrictEqual(["label", "title", "tone", "size"])
        expect(iconButtonMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("names every button from its label", async () => {
        const screen = await render(<IconButtonDemo />)
        for (const label of ["Search spots", "Delete list", "Add spot"]) {
            await expect.element(screen.getByRole("button", { name: label })).toBeInTheDocument()
        }
    })
})
