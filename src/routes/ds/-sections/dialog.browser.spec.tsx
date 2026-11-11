import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { DialogDemo, dialogMeta } from "./dialog"

describe("Dialog design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(dialogMeta.importPath).toBe("src/ui/dialog.tsx")
        expect(dialogMeta.props.map((prop) => prop.name)).toStrictEqual(["open", "size", "padding", "showCloseButton"])
        expect(dialogMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("opens the task from the trigger", async () => {
        const screen = await render(<DialogDemo />)
        await screen.getByRole("button", { name: "Leave group" }).click()
        await expect.element(screen.getByRole("dialog")).toBeInTheDocument()
        await expect.element(screen.getByText("Leave supper club?")).toBeInTheDocument()
    })
})
