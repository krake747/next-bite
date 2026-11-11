import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { SeparatorDemo, separatorMeta } from "./separator"

describe("Separator design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(separatorMeta, {
            importPath: "src/ui/separator.tsx",
            props: ["orientation"],
        })
        expect(separatorMeta.id).toBe("separator")
    })

    test("renders both orientations", async () => {
        const screen = await render(<SeparatorDemo />)
        await expect.element(screen.getByText("Your lists")).toBeInTheDocument()
        const separators = screen.container.querySelectorAll('[data-slot="separator"]')
        expect(separators.length).toBe(3)
        // eslint-disable-next-line unicorn/prefer-dom-node-dataset -- querySelectorAll returns Element, which lacks dataset; getAttribute is the typed API.
        expect(separators[0]?.getAttribute("data-slot")).toBe("separator")
    })
})
