import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { FriendPresence } from "./friend-presence"

describe("FriendPresence", () => {
    test("announces active and away states to assistive technology", () => {
        const { rerender } = render(<FriendPresence active />)
        expect(screen.getByText("Active now")).toBeInTheDocument()
        rerender(<FriendPresence active={false} />)
        expect(screen.getByText("Away")).toBeInTheDocument()
    })
})
