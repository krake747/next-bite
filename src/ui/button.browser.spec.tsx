import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { Button } from "./button"

describe("Button", () => {
    it("marks loading state", () => {
        const { unmount } = render(<Button loading> saving</Button>)
        expect(screen.getByRole("button")).toHaveAttribute("data-loading", "")
        unmount()
        render(<Button>Save</Button>)
        expect(screen.getByRole("button")).not.toHaveAttribute("data-loading")
    })
})
