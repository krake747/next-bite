import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { Button } from "./button"

describe("Button", () => {
    it("renders children as a button", () => {
        render(<Button>Save</Button>)
        const button = screen.getByRole("button", { name: "Save" })
        expect(button.tagName).toBe("BUTTON")
        expect(button.getAttribute("type")).toBe("button")
    })

    it("passes disabled through", () => {
        render(<Button disabled>Save</Button>)
        expect(screen.getByRole("button")).toBeDisabled()
    })
})
