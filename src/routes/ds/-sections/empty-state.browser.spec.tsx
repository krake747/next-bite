import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { EmptyStateDemo, emptyStateMeta } from "./empty-state"

describe("EmptyState design-system section", () => {
    test("points at the pattern with props and guidance", () => {
        expect(emptyStateMeta.importPath).toBe("src/pattern/empty-state.tsx")
        expect(emptyStateMeta.props.map((prop) => prop.name)).toStrictEqual(["title", "body", "className"])
        expect(emptyStateMeta.guidance.whenToUse.length).toBeGreaterThan(0)
        expect(emptyStateMeta.guidance.whenToAvoid.length).toBeGreaterThan(0)
    })

    test("renders an inviting list and a title-only state", async () => {
        const screen = await render(<EmptyStateDemo />)
        await expect.element(screen.getByText("No lists yet")).toBeInTheDocument()
        await expect.element(screen.getByText("Save your first restaurant to start a list.")).toBeInTheDocument()
        await expect.element(screen.getByText("No friends yet")).toBeInTheDocument()
    })
})
