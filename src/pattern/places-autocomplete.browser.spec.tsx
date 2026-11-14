import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { PlacesAutocomplete } from "./places-autocomplete"

describe("PlacesAutocomplete Google attribution", () => {
    test("shows Powered by Google beside the place search", async () => {
        const screen = await render(
            <PlacesAutocomplete label="Find the restaurant" value="" onChange={vi.fn<() => void>()} />,
        )
        await expect.element(screen.getByText("Find the restaurant")).toBeInTheDocument()
        const attribution = screen.getByText("Powered by Google")
        await expect.element(attribution).toBeInTheDocument()
        await expect.element(attribution).toHaveAttribute("translate", "no")
    })
})
