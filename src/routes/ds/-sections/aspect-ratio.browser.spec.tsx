import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { AspectRatioDemo, aspectRatioMeta } from "./aspect-ratio"
import { expectSectionMeta } from "./section-spec"

describe("Aspect ratio design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(aspectRatioMeta, {
            importPath: "src/ui/aspect-ratio.tsx",
            props: ["ratio", "children", "className"],
        })
        expect(aspectRatioMeta.id).toBe("aspect-ratio")
    })

    test("renders the frame with its ratio variable", async () => {
        const screen = await render(<AspectRatioDemo />)
        const content = screen.getByText("16 by 9 frame")
        await expect.element(content).toBeInTheDocument()
        const frame = content.element().closest('[data-slot="aspect-ratio"]')
        // eslint-disable-next-line unicorn/prefer-dom-node-dataset -- closest returns Element, which lacks dataset; getAttribute is the typed API.
        expect(frame?.getAttribute("data-slot")).toBe("aspect-ratio")
        // eslint-disable-next-line unicorn/prefer-dom-node-dataset -- closest returns Element, which lacks dataset; getAttribute is the typed API.
        expect(frame?.getAttribute("data-ratio")).toBe(String(16 / 9))
    })
})
