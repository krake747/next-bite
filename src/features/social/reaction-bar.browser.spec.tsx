import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"

import { ReactionBar } from "./reaction-bar"

describe("ReactionBar", () => {
    test("toggles like and want through callbacks", async () => {
        const user = userEvent.setup()
        const onToggleLike = vi.fn<() => void>()
        const onToggleWant = vi.fn<() => void>()
        const onComment = vi.fn<() => void>()
        render(
            <ReactionBar
                reactions={{
                    liked: false,
                    likeCount: 3,
                    onToggleLike,
                    commentCount: 1,
                    onComment,
                    wanted: false,
                    wantCount: 4,
                    onToggleWant,
                }}
            />,
        )
        await user.click(screen.getByRole("button", { name: /Like/ }))
        await user.click(screen.getByRole("button", { name: /Want to try/ }))
        await user.click(screen.getByRole("button", { name: /Comments/ }))
        expect(onToggleLike).toHaveBeenCalledTimes(1)
        expect(onToggleWant).toHaveBeenCalledTimes(1)
        expect(onComment).toHaveBeenCalledTimes(1)
    })
})
