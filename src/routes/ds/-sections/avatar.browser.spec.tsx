import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { AvatarDemo, avatarMeta } from "./avatar"

describe("Avatar design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expect(avatarMeta.importPath).toBe("src/ui/avatar.tsx")
        expect(avatarMeta.props.map((prop) => prop.name)).toStrictEqual(["size", "ring", "children"])
        expect(avatarMeta.guidance.whenToUse.length).toBeGreaterThan(0)
    })

    test("renders every size with fallback initials", async () => {
        const screen = await render(<AvatarDemo />)
        for (const initials of ["MC", "P", "SR", "J", "A"]) {
            await expect.element(screen.getByText(initials, { exact: true })).toBeInTheDocument()
        }
    })
})
