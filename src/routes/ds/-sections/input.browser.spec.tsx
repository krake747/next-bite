import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { InputDemo, inputMeta } from "./input"

describe("Input design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(inputMeta.importPath).toBe("src/ui/input.tsx")
        expect(inputMeta.props.map((prop) => prop.name)).toStrictEqual(["type", "placeholder", "disabled"])
        expect(inputMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders a labelled field and a disabled field", async () => {
        const screen = await render(<InputDemo />)
        await expect.element(screen.getByLabelText("Group name")).toHaveAttribute("placeholder", "Sunday supper club")
        await expect.element(screen.getByLabelText("Invite code")).toBeDisabled()
    })
})
