import { describe, expect, test, vi } from "vitest"
import { render } from "vitest-browser-react"

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

async function renderNotice() {
    return render(<SessionTimeoutNotice />)
}

describe("SessionTimeoutNotice", () => {
    test("offers a retry when the session times out", async () => {
        const retry = vi.fn<() => void>()
        scriptedStatus = { kind: "timed-out", userId: "user-1", retry }
        const screen = await renderNotice()

        await expect.element(screen.getByRole("alert")).toBeInTheDocument()
        await screen.getByRole("button", { name: "Try again" }).click()
        expect(retry).toHaveBeenCalledTimes(1)
    })

    test("stays hidden for a ready session", async () => {
        scriptedStatus = { kind: "ready", userId: "user-1" }
        const screen = await renderNotice()

        await expect.element(screen.getByRole("alert")).not.toBeInTheDocument()
    })

    test("stays hidden while loading", async () => {
        scriptedStatus = { kind: "loading" }
        const screen = await renderNotice()

        await expect.element(screen.getByRole("alert")).not.toBeInTheDocument()
    })

    test("stays hidden when signed out", async () => {
        scriptedStatus = { kind: "signed-out" }
        const screen = await renderNotice()

        await expect.element(screen.getByRole("alert")).not.toBeInTheDocument()
    })
})
