import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { CommentList } from "./comment-list"

const comments = [
    { id: "c1", author: "Alex", text: "The pasta is unreal.", time: "2h ago" },
    { id: "c2", author: "Priya", text: "Going Friday!", time: "1h ago" },
]

describe("CommentList", () => {
    test("adds a comment through the form", async () => {
        const onAdd = vi.fn<(text: string) => void>()
        const onDelete = vi.fn<(id: string) => void>()
        const screen = await render(
            <CommentList comments={comments} currentUser="Alex" onAdd={onAdd} onDelete={onDelete} />,
        )
        await expect.element(screen.getByText("2 comments")).toBeInTheDocument()

        await screen.getByLabelText("Write a comment").fill("Count me in")
        await screen.getByRole("button", { name: "Post" }).click()
        expect(onAdd).toHaveBeenCalledWith("Count me in")
    })

    test("lets authors delete their own comments", async () => {
        const onAdd = vi.fn<(text: string) => void>()
        const onDelete = vi.fn<(id: string) => void>()
        const screen = await render(
            <CommentList comments={comments} currentUser="Alex" onAdd={onAdd} onDelete={onDelete} />,
        )

        await screen.getByRole("button", { name: "Delete comment by Alex" }).click()
        expect(onDelete).toHaveBeenCalledWith("c1")
    })

    test("hides delete for other authors", async () => {
        const onAdd = vi.fn<(text: string) => void>()
        const onDelete = vi.fn<(id: string) => void>()
        const screen = await render(
            <CommentList comments={comments} currentUser="Alex" onAdd={onAdd} onDelete={onDelete} />,
        )

        await expect.element(screen.getByRole("button", { name: "Delete comment by Priya" })).not.toBeInTheDocument()
    })
})
