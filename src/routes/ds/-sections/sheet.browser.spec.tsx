import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { SheetDemo, sheetMeta } from "./sheet"

describe("Sheet design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(sheetMeta.importPath).toBe("src/ui/sheet.tsx")
        expect(sheetMeta.props.map((prop) => prop.name)).toStrictEqual(["side", "showCloseButton", "open"])
        expect(sheetMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("slides the panel in from the trigger", async () => {
        const screen = await render(<SheetDemo />)
        await screen.getByRole("button", { name: "Filter spots" }).click()
        await expect.element(screen.getByText("Narrow the list without losing your place.")).toBeInTheDocument()
    })
})
