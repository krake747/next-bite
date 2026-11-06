import { render, screen } from "@testing-library/react"
import { describe, test, expect } from "vitest"

import { SearchInput } from "./search-input"

describe("SearchInput", () => {
    test("marks the empty state on the wrapper", () => {
        render(<SearchInput defaultValue="" />)

        expect(screen.getByRole("searchbox").closest('[data-slot="search-input"]')).toHaveAttribute("data-empty", "")
    })

    test("clears the empty state with a value", () => {
        render(<SearchInput defaultValue="sushi" />)

        expect(screen.getByRole("searchbox").closest('[data-slot="search-input"]')).not.toHaveAttribute("data-empty")
    })
})
