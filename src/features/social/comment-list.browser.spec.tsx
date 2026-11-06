import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { CommentList } from "./comment-list"

const comments = [
    { id: "c1", author: "Alex", text: "The pasta is unreal.", time: "2h ago" },
    { id: "c2", author: "Priya", text: "Going Friday!", time: "1h ago" },
]

describe("CommentList", () => {
    test("adds a comment through the form", async () => {
        const user = userEvent.setup()
        const onAdd = vi.fn<(text: string) => void>()
        const onDelete = vi.fn<(id: string) => void>()
        render(<CommentList comments={comments} currentUser="Alex" onAdd={onAdd} onDelete={onDelete} />)
        expect(screen.getByText("2 comments")).toBeInTheDocument()

        await user.type(screen.getByLabelText("Write a comment"), "Count me in")
        await user.click(screen.getByRole("button", { name: "Post" }))
        expect(onAdd).toHaveBeenCalledWith("Count me in")
    })

    test("lets authors delete their own comments", async () => {
        const user = userEvent.setup()
        const onAdd = vi.fn<(text: string) => void>()
        const onDelete = vi.fn<(id: string) => void>()
        render(<CommentList comments={comments} currentUser="Alex" onAdd={onAdd} onDelete={onDelete} />)

        await user.click(screen.getByRole("button", { name: "Delete comment by Alex" }))
        expect(onDelete).toHaveBeenCalledWith("c1")
    })

    test("hides delete for other authors", () => {
        const onAdd = vi.fn<(text: string) => void>()
        const onDelete = vi.fn<(id: string) => void>()
        render(<CommentList comments={comments} currentUser="Alex" onAdd={onAdd} onDelete={onDelete} />)

        expect(screen.queryByRole("button", { name: "Delete comment by Priya" })).not.toBeInTheDocument()
    })
})
