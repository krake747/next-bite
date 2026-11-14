import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { AtmosphereFlags, GooglePhotoGallery } from "./place-atmosphere"

const photos = [
    {
        name: "places/ChIJtest/photos/photo-one",
        authorDisplayName: "Ava",
        authorUri: "https://maps.google.com/author",
        flagContentUri: "https://maps.google.com/flag",
        googleMapsUri: "https://maps.google.com/photo",
    },
]

describe("GooglePhotoGallery", () => {
    test("shows author credit, source links, and report affordances", async () => {
        const screen = await render(<GooglePhotoGallery photos={photos} apiKey="test-key" />)

        await expect.element(screen.getByText("Ava")).toBeInTheDocument()
        await expect.element(screen.getByText("Source")).toBeInTheDocument()
        await expect.element(screen.getByText("Report")).toBeInTheDocument()
        await expect.element(screen.getByText("Powered by Google")).toBeInTheDocument()
    })
})

describe("AtmosphereFlags", () => {
    test("shows flags with disclosure text and summary links", async () => {
        const screen = await render(
            <AtmosphereFlags
                flags={{ servesVegetarianFood: true, goodForGroups: true, reservable: false }}
                reviewSummary={{
                    text: "Guests love the terrace",
                    disclosureText: "Summarized with Gemini",
                    flagContentUri: "https://maps.google.com/report",
                    reviewsUri: "https://maps.google.com/reviews",
                }}
            />,
        )

        await expect.element(screen.getByText("Vegetarian food")).toBeInTheDocument()
        await expect.element(screen.getByText("Good for groups")).toBeInTheDocument()
        await expect.element(screen.getByText("Summarized with Gemini")).toBeInTheDocument()
        await expect.element(screen.getByText("About this summary")).toBeInTheDocument()
        await expect.element(screen.getByText("Report summary")).toBeInTheDocument()
        await expect.element(screen.getByText("See reviews")).toBeInTheDocument()
    })
})
