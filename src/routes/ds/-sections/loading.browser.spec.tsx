import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { LoadingDemo, loadingMeta } from "./loading"

describe("Loading design-system section", () => {
    test("documents a distinct use for every loading pattern", () => {
        const uses = loadingMeta.anatomy.map((row) => row.description)
        expect(new Set(uses).size).toBe(loadingMeta.anatomy.length)
        expect(loadingMeta.anatomy.map((row) => row.element)).toStrictEqual([
            "AppInitializing",
            "Page skeletons",
            "LoadingPlaceholder",
            "InlineLoading",
            "PendingButton",
        ])
    })

    test("renders every pattern and page skeleton", async () => {
        const screen = await render(<LoadingDemo />)
        for (const name of [
            "Starting Next Bite",
            "Loading",
            "Loading your home feed",
            "Loading your lists",
            "Loading your friends",
            "Loading your groups",
            "Loading your details",
        ]) {
            await expect.element(screen.getByRole("status", { name, exact: true })).toBeInTheDocument()
        }
        await expect.element(screen.getByRole("button", { name: "Saving" })).toHaveAttribute("aria-busy", "true")
    })
})
