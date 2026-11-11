import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { SkeletonDemo, skeletonMeta } from "./skeleton"

describe("Skeleton design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(skeletonMeta, {
            importPath: "src/ui/skeleton.tsx",
            props: ["children", "className"],
        })
        expect(skeletonMeta.id).toBe("skeleton")
    })

    test("renders shaped stand-ins", async () => {
        const screen = await render(<SkeletonDemo />)
        await expect.element(screen.getByLabelText("Loading preview")).toBeInTheDocument()
        const blocks = screen.container.querySelectorAll('[data-slot="skeleton"]')
        expect(blocks.length).toBe(5)
        // eslint-disable-next-line unicorn/prefer-dom-node-dataset -- querySelectorAll returns Element, which lacks dataset; getAttribute is the typed API.
        expect(blocks[0]?.getAttribute("data-slot")).toBe("skeleton")
    })
})
