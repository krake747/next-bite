import { render, screen } from "@testing-library/react"
import { describe, test, expect } from "vitest"

import { Button } from "./button"

describe("Button", () => {
    test("renders children as a button", () => {
        render(<Button>Save</Button>)
        const button = screen.getByRole("button", { name: "Save" })
        expect(button.getAttribute("type")).toBe("button")
    })

    test("passes disabled through", () => {
        render(<Button disabled>Save</Button>)
        expect(screen.getByRole("button")).toBeDisabled()
    })
})
