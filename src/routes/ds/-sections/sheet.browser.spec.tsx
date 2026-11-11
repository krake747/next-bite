import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { SheetDemo, sheetMeta } from "./sheet"

describe("Sheet design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(sheetMeta, {
            importPath: "src/ui/sheet.tsx",
            props: ["side", "showCloseButton", "open"],
        })
        expect(sheetMeta.id).toBe("sheet")
    })

    test("slides the panel in from the trigger", async () => {
        const screen = await render(<SheetDemo />)
        await screen.getByRole("button", { name: "Filter spots" }).click()
        await expect.element(screen.getByText("Narrow the list without losing your place.")).toBeInTheDocument()
    })
})
