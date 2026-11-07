import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { Button } from "./button"

describe("Button", () => {
    test("renders children as a button", async () => {
        const screen = await render(<Button>Save</Button>)
        const button = screen.getByRole("button", { name: "Save" })
        await expect.element(button).toBeInTheDocument()
        await expect.element(button).toHaveAttribute("type", "button")
    })

    test("passes disabled through", async () => {
        const screen = await render(<Button disabled>Save</Button>)
        await expect.element(screen.getByRole("button")).toBeDisabled()
    })
})
