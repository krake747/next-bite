import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { AppInitializing, InlineLoading, LoadingPlaceholder } from "./loading"

describe("loading patterns", () => {
    test("app initializing announces the app is starting", async () => {
        const screen = await render(<AppInitializing />)
        await expect.element(screen.getByRole("status", { name: "Starting Next Bite" })).toBeInTheDocument()
        await expect.element(screen.getByText("Next Bite")).toBeInTheDocument()
    })

    test("section loading announces a generic wait", async () => {
        const screen = await render(<LoadingPlaceholder />)
        await expect.element(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument()
    })

    test("inline loading announces what is loading", async () => {
        const screen = await render(<InlineLoading>Loading friends…</InlineLoading>)
        await expect.element(screen.getByRole("status")).toHaveTextContent("Loading friends…")
    })
})
