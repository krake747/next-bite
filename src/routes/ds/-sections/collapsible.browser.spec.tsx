import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { CollapsibleDemo, collapsibleMeta } from "./collapsible"
import { expectSectionMeta } from "./section-spec"

describe("Collapsible design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(collapsibleMeta, {
            importPath: "src/ui/collapsible.tsx",
            props: ["defaultOpen", "open", "onOpenChange"],
        })
        expect(collapsibleMeta.id).toBe("collapsible")
    })

    test("toggles the panel from the trigger", async () => {
        const screen = await render(<CollapsibleDemo />)
        await screen.getByRole("button", { name: "Show details" }).click()
        await expect.element(screen.getByText(/The kitchen closes at ten/)).toBeInTheDocument()
    })
})
