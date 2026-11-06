import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { GroupHeader } from "./group-header"

const members = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]

describe("GroupHeader", () => {
    test("shows identity, counts, and members", () => {
        render(<GroupHeader name="Food Crew" description="Weekend plans" members={members} restaurantCount={2} />)
        expect(screen.getByRole("heading", { name: "Food Crew" })).toBeInTheDocument()
        expect(screen.getByText("Weekend plans")).toBeInTheDocument()
        expect(screen.getByText("2 spots")).toBeInTheDocument()
        expect(screen.getByText("3 members")).toBeInTheDocument()
    })
})
