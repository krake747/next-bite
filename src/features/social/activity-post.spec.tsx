import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { toId } from "@api/data.model"
import { type Restaurant } from "@core/restaurants"

import { ActivityPost } from "./activity-post"

const placeId = toId<"places">("p1")
const ownerId = toId<"profiles">("user-1")

function restaurantWith(overrides: Partial<Restaurant>): Restaurant {
    return {
        _id: placeId,
        _creationTime: new Date("2026-03-04T12:00:00Z").getTime(),
        ownerId,
        ownerName: "Alex",
        name: "Trattoria Verde",
        cuisine: "Italian",
        address: { label: "Luxembourg City" },
        photos: [],
        mySave: null,
        wantCount: 0,
        ...overrides,
    }
}

describe("ActivityPost", () => {
    test("renders author, text, restaurant, and reactions from the restaurant", () => {
        const photoUrl = "https://example.com/s1.jpg"
        render(
            <ActivityPost
                restaurant={restaurantWith({
                    note: "Great carbonara.",
                    photos: [{ url: photoUrl, storageId: toId<"_storage">("s1") }],
                    wantCount: 3,
                })}
                reactions={{ wanted: true, wantCount: 3, onToggleWant: () => {} }}
            />,
        )

        expect(screen.getByText("Alex")).toBeInTheDocument()
        expect(screen.getByText("Great carbonara.")).toBeInTheDocument()
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByText("Italian")).toBeInTheDocument()
        expect(screen.getByAltText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Want to try, 3" })).toBeInTheDocument()
    })

    test("falls back to added text with no note, photos, or reactions", () => {
        render(<ActivityPost restaurant={restaurantWith({ cuisine: undefined })} />)

        expect(screen.getByText("Added Trattoria Verde.")).toBeInTheDocument()
        expect(screen.queryByRole("img")).not.toBeInTheDocument()
        expect(screen.queryByRole("group", { name: "Reactions" })).not.toBeInTheDocument()
    })

    test("toggles want through the reactions handler", async () => {
        const onToggleWant = vi.fn<() => void>()
        const user = userEvent.setup()
        render(
            <ActivityPost restaurant={restaurantWith({})} reactions={{ wanted: false, wantCount: 0, onToggleWant }} />,
        )

        await user.click(screen.getByRole("button", { name: "Want to try, 0" }))
        expect(onToggleWant).toHaveBeenCalledTimes(1)
    })
})
