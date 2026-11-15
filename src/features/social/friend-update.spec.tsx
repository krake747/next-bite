import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { toId, type Id } from "@api/data.model"
import { type Restaurant } from "@core/restaurants"

import { FriendUpdate } from "./friend-update"

const restaurantId = toId<"places">("p1")
const ownerId = toId<"profiles">("user-1")

function isStorageId(value: string): value is Id<"_storage"> {
    return value.length > 0
}

function mustBeStorageId(value: string): Id<"_storage"> {
    if (!isStorageId(value)) {
        throw new Error("Test photo needs a storage id")
    }
    return value
}

function restaurantWith(overrides?: {
    readonly note?: string | undefined
    readonly cuisine?: string | undefined
    readonly photos?: Restaurant["photos"] | undefined
    readonly wantCount?: number | undefined
}): Restaurant {
    return {
        _id: restaurantId,
        _creationTime: new Date("2026-03-04T12:00Z").getTime(),
        ownerId,
        ownerName: "Alex",
        name: "Trattoria Verde",
        ...(overrides?.cuisine !== undefined ? { cuisine: overrides.cuisine } : {}),
        address: { label: "Luxembourg City" },
        photos: overrides?.photos ?? [],
        mySave: null,
        wantCount: overrides?.wantCount ?? 0,
        ...(overrides?.note !== undefined ? { note: overrides.note } : {}),
    }
}

describe("FriendUpdate", () => {
    test("renders author, text, restaurant, and want from the restaurant", () => {
        const photoUrl = "https://example.com/s1.jpg"
        render(
            <FriendUpdate
                restaurant={restaurantWith({
                    note: "Great carbonara.",
                    cuisine: "Italian",
                    photos: [{ url: photoUrl, storageId: mustBeStorageId("s1") }],
                    wantCount: 3,
                })}
                want={{ wanted: true, tried: false, wantCount: 3, onToggleWant: () => {}, onToggleBeen: () => {} }}
            />,
        )

        expect(screen.getByText("Alex")).toBeInTheDocument()
        expect(screen.getByText("Great carbonara.")).toBeInTheDocument()
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByText("Italian")).toBeInTheDocument()
        expect(screen.getByAltText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByRole("button", { name: "Want to try, 3" })).toBeInTheDocument()
    })

    test("falls back to added text with no note, photos, or want", () => {
        render(<FriendUpdate restaurant={restaurantWith()} />)

        expect(screen.getByText("Added Trattoria Verde.")).toBeInTheDocument()
        expect(screen.queryByRole("img")).not.toBeInTheDocument()
        expect(screen.queryByRole("group", { name: "Want" })).not.toBeInTheDocument()
    })

    test("toggles want through the want handler", async () => {
        const onToggleWant = vi.fn<() => void>()
        const onToggleBeen = vi.fn<() => void>()
        const user = userEvent.setup()
        render(
            <FriendUpdate
                restaurant={restaurantWith({})}
                want={{ wanted: false, tried: false, wantCount: 0, onToggleWant, onToggleBeen }}
            />,
        )

        await user.click(screen.getByRole("button", { name: "Want to try, 0" }))
        expect(onToggleWant).toHaveBeenCalledTimes(1)
    })

    test("toggles been through the been handler", async () => {
        const onToggleWant = vi.fn<() => void>()
        const onToggleBeen = vi.fn<() => void>()
        const user = userEvent.setup()
        render(
            <FriendUpdate
                restaurant={restaurantWith({})}
                want={{ wanted: false, tried: false, wantCount: 0, onToggleWant, onToggleBeen }}
            />,
        )

        await user.click(screen.getByRole("button", { name: "Been there" }))
        expect(onToggleBeen).toHaveBeenCalledTimes(1)
    })
})
