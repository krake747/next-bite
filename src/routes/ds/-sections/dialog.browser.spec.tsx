import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { DialogDemo, dialogMeta } from "./dialog"
import { expectSectionMeta } from "./section-spec"

describe("Dialog design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(dialogMeta, {
            importPath: "src/ui/dialog.tsx",
            props: ["open", "size", "padding", "showCloseButton"],
        })
        expect(dialogMeta.id).toBe("dialog")
    })

    test("opens the task from the trigger", async () => {
        const screen = await render(<DialogDemo />)
        await screen.getByRole("button", { name: "Leave group" }).click()
        await expect.element(screen.getByRole("dialog")).toBeInTheDocument()
        await expect.element(screen.getByText("Leave supper club?")).toBeVisible()
    })
})
