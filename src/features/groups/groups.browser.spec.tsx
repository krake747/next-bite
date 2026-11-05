import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { GroupCard } from "./group-card"
import { GroupHeader } from "./group-header"
import { GroupMembers } from "./group-members"
import { SharedRestaurantList } from "./shared-restaurant-list"

const members = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]

const restaurants = [
    { id: "r1", name: "Trattoria Verde", cuisine: "Italian", addedBy: "Alex" },
    { id: "r2", name: "Sushi Bar", cuisine: "Japanese", addedBy: "Priya" },
]

describe("GroupMembers", () => {
    it("shows members and invites when empty", () => {
        const { rerender } = render(<GroupMembers members={members} />)
        expect(screen.getByText("3 members")).toBeInTheDocument()
        rerender(<GroupMembers members={[]} />)
        expect(screen.getByText(/Invite your friends/)).toBeInTheDocument()
    })
})

describe("GroupHeader", () => {
    it("shows identity, counts, and members", () => {
        render(<GroupHeader name="Food Crew" description="Weekend plans" members={members} restaurantCount={2} />)
        expect(screen.getByRole("heading", { name: "Food Crew" })).toBeInTheDocument()
        expect(screen.getByText("Weekend plans")).toBeInTheDocument()
        expect(screen.getByText("2 spots")).toBeInTheDocument()
        expect(screen.getByText("3 members")).toBeInTheDocument()
    })
})

describe("SharedRestaurantList", () => {
    it("lists shared spots and reports selection", async () => {
        const user = userEvent.setup()
        const onSelect = vi.fn<(id: string) => void>()
        render(<SharedRestaurantList items={restaurants} onSelect={onSelect} />)
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()

        await user.click(screen.getByRole("button", { name: /Sushi Bar/ }))
        expect(onSelect).toHaveBeenCalledWith("r2")
    })

    it("invites sharing when empty", () => {
        render(<SharedRestaurantList items={[]} />)
        expect(screen.getByText(/Share somewhere/)).toBeInTheDocument()
    })
})

describe("GroupCard", () => {
    it("composes header, list, and members", () => {
        render(<GroupCard name="Food Crew" members={members} restaurants={restaurants} />)
        expect(screen.getByRole("heading", { name: "Food Crew" })).toBeInTheDocument()
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.queryByText("2 members")).not.toBeInTheDocument()
        expect(screen.getByText("3 members")).toBeInTheDocument()
    })
})
