import { describe, test, expect } from "vitest"
import { render } from "vitest-browser-react"

import { SearchInput } from "./search-input"

describe("SearchInput", () => {
    test("marks the empty state on the wrapper", async () => {
        const screen = await render(<SearchInput defaultValue="" />)

        const wrapper = screen.getByRole("searchbox").element().closest<HTMLElement>('[data-slot="search-input"]')
        expect(wrapper?.dataset.empty).toBe("")
    })

    test("clears the empty state with a value", async () => {
        const screen = await render(<SearchInput defaultValue="sushi" />)

        const wrapper = screen.getByRole("searchbox").element().closest<HTMLElement>('[data-slot="search-input"]')
        expect(wrapper?.dataset.empty).toBeUndefined()
    })
})
