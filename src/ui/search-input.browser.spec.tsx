import { render, screen } from "@testing-library/react"
import { describe, test, expect } from "vitest"

import { SearchInput } from "./search-input"

describe("SearchInput", () => {
    test("marks empty state on the wrapper", () => {
        const { unmount } = render(<SearchInput defaultValue="" />)
        expect(screen.getByRole("searchbox").closest('[data-slot="search-input"]')).toHaveAttribute("data-empty", "")
        unmount()
        render(<SearchInput defaultValue="sushi" />)
        expect(screen.getByRole("searchbox").closest('[data-slot="search-input"]')).not.toHaveAttribute("data-empty")
    })
})
