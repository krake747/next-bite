import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { GroupCard } from "./group-card"

const members = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]

const restaurants = [
    { id: "r1", name: "Trattoria Verde", cuisine: "Italian", ownerName: "Alex" },
    { id: "r2", name: "Sushi Bar", cuisine: "Japanese", ownerName: "Priya" },
]

describe("GroupCard", () => {
    test("composes header, list, and members", async () => {
        const screen = await render(<GroupCard name="Food Crew" members={members} restaurants={restaurants} />)
        await expect.element(screen.getByRole("heading", { name: "Food Crew" })).toBeInTheDocument()
        await expect.element(screen.getByText("Trattoria Verde")).toBeInTheDocument()
        await expect.element(screen.getByText("2 members")).not.toBeInTheDocument()
        await expect.element(screen.getByText("3 members")).toBeInTheDocument()
    })
})
