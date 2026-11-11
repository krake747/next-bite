import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { AspectRatioDemo, aspectRatioMeta } from "./aspect-ratio"

describe("Aspect ratio design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(aspectRatioMeta.importPath).toBe("src/ui/aspect-ratio.tsx")
        expect(aspectRatioMeta.props.map((prop) => prop.name)).toStrictEqual(["ratio", "children", "className"])
        expect(aspectRatioMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders the frame with its ratio variable", async () => {
        const screen = await render(<AspectRatioDemo />)
        await expect.element(screen.getByText("16 by 9 frame")).toBeInTheDocument()
        const frame = document.querySelector('[data-slot="aspect-ratio"]')
        expect(frame?.getAttribute("style")).toContain("--ratio")
    })
})
