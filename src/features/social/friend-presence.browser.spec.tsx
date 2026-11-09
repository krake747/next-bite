import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { FriendPresence } from "./friend-presence"

describe("FriendPresence", () => {
    test("announces active and away states to assistive technology", async () => {
        const screen = await render(<FriendPresence active />)
        await expect.element(screen.getByText("Active now")).toBeInTheDocument()
        await screen.rerender(<FriendPresence active={false} />)
        await expect.element(screen.getByText("Away")).toBeInTheDocument()
    })
})
