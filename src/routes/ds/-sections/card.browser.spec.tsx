import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { CardDemo, cardMeta } from "./card"
import { expectSectionMeta } from "./section-spec"

describe("Card design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(cardMeta, {
            importPath: "src/ui/card.tsx",
            props: ["children", "className"],
        })
        expect(cardMeta.id).toBe("card")
    })

    test("renders grouped content on the surface", async () => {
        const screen = await render(<CardDemo />)
        await expect.element(screen.getByText("Sunday supper club")).toBeInTheDocument()
    })
})
