import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { GroupHeader } from "./group-header"

const members = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]

describe("GroupHeader", () => {
    test("shows identity, counts, and members", async () => {
        const screen = await render(
            <GroupHeader name="Food Crew" description="Weekend plans" members={members} restaurantCount={2} />,
        )
        await expect.element(screen.getByRole("heading", { name: "Food Crew" })).toBeInTheDocument()
        await expect.element(screen.getByText("Weekend plans")).toBeInTheDocument()
        await expect.element(screen.getByText("2 spots")).toBeInTheDocument()
        await expect.element(screen.getByText("3 members")).toBeInTheDocument()
    })
})
