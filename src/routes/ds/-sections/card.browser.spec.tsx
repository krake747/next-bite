import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { CardDemo, cardMeta } from "./card"

describe("Card design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(cardMeta.importPath).toBe("src/ui/card.tsx")
        expect(cardMeta.props.map((prop) => prop.name)).toStrictEqual(["children", "className"])
        expect(cardMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders grouped content on the surface", async () => {
        const screen = await render(<CardDemo />)
        await expect.element(screen.getByText("Sunday supper club")).toBeInTheDocument()
    })
})
