import { describe, test, expect } from "vitest"
import { render } from "vitest-browser-react"

import { Badge } from "./badge"

describe("Badge", () => {
    test("renders interest states with accessible labels", async () => {
        const screen = await render(<Badge tone="brand">Want to try</Badge>)
        await expect.element(screen.getByText("Want to try")).toHaveAttribute("data-variant", "brand")
        await screen.unmount()
        const rerendered = await render(<Badge tone="success">Been there</Badge>)
        await expect.element(rerendered.getByText("Been there")).toHaveAttribute("data-variant", "success")
    })
})
