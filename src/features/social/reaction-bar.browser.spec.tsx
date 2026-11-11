import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

import { ReactionBar } from "./reaction-bar"

describe("ReactionBar", () => {
    test("toggles want through its callback", async () => {
        const onToggleWant = vi.fn<() => void>()
        const screen = await render(<ReactionBar reactions={{ wanted: false, wantCount: 4, onToggleWant }} />)
        await screen.getByRole("button", { name: /Want to try/ }).click()
        expect(onToggleWant).toHaveBeenCalledTimes(1)
    })
})
