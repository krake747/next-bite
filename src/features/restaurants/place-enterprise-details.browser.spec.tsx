import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { PlaceEnterpriseDetails } from "./place-enterprise-details"

describe("PlaceEnterpriseDetails", () => {
    test("renders rating, count, price, and website on the detail screen", async () => {
        const screen = await render(
            <PlaceEnterpriseDetails
                details={{
                    rating: 4.5,
                    ratingCount: 123,
                    priceLevel: "PRICE_LEVEL_MODERATE",
                    websiteUri: "https://example.com/trattoria",
                }}
            />,
        )
        await expect.element(screen.getByText("4.5")).toBeInTheDocument()
        await expect.element(screen.getByText("(123)")).toBeInTheDocument()
        await expect.element(screen.getByText("$$")).toBeInTheDocument()
        await expect.element(screen.getByText("Website")).toBeInTheDocument()
        const attribution = screen.getByText("Powered by Google")
        await expect.element(attribution).toBeInTheDocument()
    })

    test("renders nothing new while loading", async () => {
        const screen = await render(<PlaceEnterpriseDetails details={undefined} />)
        await expect.element(screen.getByText("4.5")).not.toBeInTheDocument()
    })
})
