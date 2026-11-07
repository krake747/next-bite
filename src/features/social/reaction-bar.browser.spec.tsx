import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { ReactionBar } from "./reaction-bar"

describe("ReactionBar", () => {
    test("toggles like and want through callbacks", async () => {
        const onToggleLike = vi.fn<() => void>()
        const onToggleWant = vi.fn<() => void>()
        const onComment = vi.fn<() => void>()
        const screen = await render(
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
        await screen.getByRole("button", { name: /Like/ }).click()
        await screen.getByRole("button", { name: /Want to try/ }).click()
        await screen.getByRole("button", { name: /Comments/ }).click()
        expect(onToggleLike).toHaveBeenCalledTimes(1)
        expect(onToggleWant).toHaveBeenCalledTimes(1)
        expect(onComment).toHaveBeenCalledTimes(1)
    })
})
