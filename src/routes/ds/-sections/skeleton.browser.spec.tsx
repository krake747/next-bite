import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { SkeletonDemo, skeletonMeta } from "./skeleton"

describe("Skeleton design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(skeletonMeta.importPath).toBe("src/ui/skeleton.tsx")
        expect(skeletonMeta.props.map((prop) => prop.name)).toStrictEqual(["children", "className"])
        expect(skeletonMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders shaped stand-ins", async () => {
        const screen = await render(<SkeletonDemo />)
        await expect.element(screen.getByLabelText("Loading preview")).toBeInTheDocument()
        const blocks = document.querySelectorAll('[data-slot="skeleton"]')
        expect(blocks.length).toBe(5)
    })
})
