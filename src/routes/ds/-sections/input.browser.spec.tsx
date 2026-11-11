import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { InputDemo, inputMeta } from "./input"
import { expectSectionMeta } from "./section-spec"

describe("Input design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(inputMeta, {
            importPath: "src/ui/input.tsx",
            props: ["type", "placeholder", "disabled"],
        })
        expect(inputMeta.id).toBe("input")
    })

    test("renders a labelled field and a disabled field", async () => {
        const screen = await render(<InputDemo />)
        await expect.element(screen.getByLabelText("Group name")).toHaveAttribute("placeholder", "Sunday supper club")
        await expect.element(screen.getByLabelText("Invite code")).toBeDisabled()
    })
})
