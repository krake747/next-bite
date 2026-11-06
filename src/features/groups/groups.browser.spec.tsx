import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { GroupCard } from "./group-card"
import { GroupHeader } from "./group-header"
import { GroupMembers } from "./group-members"
import { SharedRestaurantList } from "./shared-restaurant-list"

const members = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]

const restaurants = [
    { id: "r1", name: "Trattoria Verde", cuisine: "Italian", ownerName: "Alex" },
    { id: "r2", name: "Sushi Bar", cuisine: "Japanese", ownerName: "Priya" },
]

describe("GroupMembers", () => {
    test("shows members and invites when empty", () => {
        const { rerender } = render(<GroupMembers members={members} />)
        expect(screen.getByText("3 members")).toBeInTheDocument()
        rerender(<GroupMembers members={[]} />)
        expect(screen.getByText(/Invite your friends/)).toBeInTheDocument()
    })
})

describe("GroupHeader", () => {
    test("shows identity, counts, and members", () => {
        render(<GroupHeader name="Food Crew" description="Weekend plans" members={members} restaurantCount={2} />)
        expect(screen.getByRole("heading", { name: "Food Crew" })).toBeInTheDocument()
        expect(screen.getByText("Weekend plans")).toBeInTheDocument()
        expect(screen.getByText("2 spots")).toBeInTheDocument()
        expect(screen.getByText("3 members")).toBeInTheDocument()
    })
})

describe("SharedRestaurantList", () => {
    test("lists shared spots", () => {
        render(<SharedRestaurantList items={restaurants} />)
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()
        expect(screen.getByText("Sushi Bar")).toBeInTheDocument()
    })

    test("invites sharing when empty", () => {
        render(<SharedRestaurantList items={[]} />)
        expect(screen.getByText(/Share somewhere/)).toBeInTheDocument()
    })
})

describe("GroupCard", () => {
    test("composes header, list, and members", () => {
        render(<GroupCard name="Food Crew" members={members} restaurants={restaurants} />)
        expect(screen.getByRole("heading", { name: "Food Crew" })).toBeInTheDocument()
        expect(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        expect(screen.queryByText("2 members")).not.toBeInTheDocument()
        expect(screen.getByText("3 members")).toBeInTheDocument()
    })
})
