import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"

import { type SessionStatus } from "@core/session"
import { SessionTimeoutNotice } from "@routes/-components/session-timeout-notice"

let scriptedStatus: SessionStatus = { kind: "loading" }

vi.mock("@core/session", async (importOriginal) => {
    const original = await importOriginal<typeof import("@core/session")>()
    return {
        ...original,
        useSessionStatus: () => scriptedStatus,
    }
})

function renderNotice(): void {
    render(<SessionTimeoutNotice />)
}

describe("SessionTimeoutNotice", () => {
    test("offers a retry when the session times out", () => {
        const retry = vi.fn<() => void>()
        scriptedStatus = { kind: "timed-out", userId: "user-1", retry }
        renderNotice()

        expect(screen.getByRole("alert")).toBeInTheDocument()
        fireEvent.click(screen.getByRole("button", { name: "Try again" }))
        expect(retry).toHaveBeenCalledTimes(1)
    })

    test("stays hidden for a ready session", () => {
        scriptedStatus = { kind: "ready", userId: "user-1" }
        renderNotice()

        expect(screen.queryByRole("alert")).toBeNull()
    })

    test("stays hidden while loading", () => {
        scriptedStatus = { kind: "loading" }
        renderNotice()

        expect(screen.queryByRole("alert")).toBeNull()
    })

    test("stays hidden when signed out", () => {
        scriptedStatus = { kind: "signed-out" }
        renderNotice()

        expect(screen.queryByRole("alert")).toBeNull()
    })
})
