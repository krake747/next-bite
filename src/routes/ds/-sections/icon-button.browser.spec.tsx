import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { IconButtonDemo, iconButtonMeta } from "./icon-button"
import { expectSectionMeta } from "./section-spec"

describe("Icon button design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(iconButtonMeta, {
            importPath: "src/ui/icon-button.tsx",
            props: ["label", "title", "tone", "size"],
        })
        expect(iconButtonMeta.id).toBe("icon-button")
    })

    test("names every button from its label", async () => {
        const screen = await render(<IconButtonDemo />)
        for (const label of ["Search spots", "Delete list", "Add spot"]) {
            await expect.element(screen.getByRole("button", { name: label })).toBeInTheDocument()
        }
    })
})
