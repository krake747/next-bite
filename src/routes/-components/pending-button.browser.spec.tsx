import { describe, test, expect } from "vitest"
import { render } from "vitest-browser-react"

import { PendingButton } from "./pending-button"

describe("PendingButton", () => {
    test("disables with a spinner while pending", async () => {
        const screen = await render(
            <PendingButton type="submit" pending={true}>
                Sign in
            </PendingButton>,
        )
        const button = screen.getByRole("button", { name: "Sign in" })
        await expect.element(button).toBeDisabled()
        await expect.element(button).toHaveAttribute("aria-busy", "true")
    })

    test("renders an enabled button when idle", async () => {
        const screen = await render(
            <PendingButton type="submit" pending={false}>
                Sign in
            </PendingButton>,
        )
        const button = screen.getByRole("button", { name: "Sign in" })
        await expect.element(button).not.toBeDisabled()
        await expect.element(button).toHaveAttribute("aria-busy", "false")
    })
})
