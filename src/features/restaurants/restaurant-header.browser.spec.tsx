import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { RestaurantHeader } from "./restaurant-header"

describe("RestaurantHeader Google attribution", () => {
    test("shows Powered by Google beside the saved place address", async () => {
        const screen = await render(
            <RestaurantHeader name="Trattoria" location="12 Rue de la Paix, Luxembourg" hasLocation={true} />,
        )
        await expect.element(screen.getByText("12 Rue de la Paix, Luxembourg")).toBeInTheDocument()
        const attribution = screen.getByText("Powered by Google")
        await expect.element(attribution).toBeInTheDocument()
        await expect.element(attribution).toHaveAttribute("translate", "no")
    })
})
