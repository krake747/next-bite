import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { TextLinkDemo, textLinkMeta } from "./text-link"

describe("Text link design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(textLinkMeta.importPath).toBe("src/ui/text-link.tsx")
        expect(textLinkMeta.props.map((prop) => prop.name)).toStrictEqual(["href", "render", "className"])
        expect(textLinkMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders a link inside the sentence", async () => {
        const screen = await render(<TextLinkDemo />)
        await expect.element(screen.getByRole("link", { name: "See the list" })).toHaveAttribute("href", "/lists")
    })
})
