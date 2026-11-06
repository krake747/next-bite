import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { GroupMembers } from "./group-members"

const members = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]

describe("GroupMembers", () => {
    test("shows members and invites when empty", () => {
        const { rerender } = render(<GroupMembers members={members} />)
        expect(screen.getByText("3 members")).toBeInTheDocument()
        rerender(<GroupMembers members={[]} />)
        expect(screen.getByText(/Invite your friends/)).toBeInTheDocument()
    })
})
