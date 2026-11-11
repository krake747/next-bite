import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { TextLinkDemo, textLinkMeta } from "./text-link"

describe("Text link design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(textLinkMeta, {
            importPath: "src/ui/text-link.tsx",
            props: ["href", "render", "className"],
        })
        expect(textLinkMeta.id).toBe("text-link")
    })

    test("renders a link inside the sentence", async () => {
        const screen = await render(<TextLinkDemo />)
        await expect.element(screen.getByRole("link", { name: "See the list" })).toHaveAttribute("href", "/lists")
    })
})
