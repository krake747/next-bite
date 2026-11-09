import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { AvatarGroup } from "./avatar-group"

const friends = [
    { name: "Alex" },
    { name: "Priya" },
    { name: "Jamie" },
    { name: "Leo" },
    { name: "Mara" },
    { name: "Noor" },
]

describe("AvatarGroup", () => {
    test("shows at most four members with an overflow indicator", async () => {
        const screen = await render(<AvatarGroup members={friends} />)
        await expect.element(screen.getByText("+2")).toBeInTheDocument()
        await expect.element(screen.getByRole("group", { name: /Alex.*2 more/ })).toBeInTheDocument()
    })

    test("renders members that share a name", async () => {
        const screen = await render(<AvatarGroup members={[{ name: "Alex" }, { name: "Alex" }]} />)
        await expect.element(screen.getByLabelText("Alex").first()).toBeInTheDocument()
        expect(screen.getByLabelText("Alex").all()).toHaveLength(2)
    })
})
