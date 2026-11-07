import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { GroupMembers } from "./group-members"

const members = [{ name: "Alex" }, { name: "Priya" }, { name: "Jamie" }]

describe("GroupMembers", () => {
    test("shows members and invites when empty", async () => {
        const screen = await render(<GroupMembers members={members} />)
        await expect.element(screen.getByText("3 members")).toBeInTheDocument()
        await screen.rerender(<GroupMembers members={[]} />)
        await expect.element(screen.getByText(/Invite your friends/)).toBeInTheDocument()
    })
})
