import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

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
    test("shows at most four members with an overflow indicator", () => {
        render(<AvatarGroup members={friends} />)
        expect(screen.getByText("+2")).toBeInTheDocument()
        expect(screen.getByRole("group", { name: /Alex.*2 more/ })).toBeInTheDocument()
    })

    test("renders members that share a name", () => {
        render(<AvatarGroup members={[{ name: "Alex" }, { name: "Alex" }]} />)
        expect(screen.getAllByLabelText("Alex")).toHaveLength(2)
    })
})
