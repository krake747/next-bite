import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { EmptyStateDemo, emptyStateMeta } from "./empty-state"
import { expectSectionMeta } from "./section-spec"

describe("EmptyState design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(emptyStateMeta, {
            importPath: "src/pattern/empty-state.tsx",
            props: ["title", "body", "className"],
        })
        expect(emptyStateMeta.guidance.whenToAvoid?.length).toBeGreaterThan(0)
    })

    test("renders an inviting list and a title-only state", async () => {
        const screen = await render(<EmptyStateDemo />)
        await expect.element(screen.getByText("No lists yet")).toBeInTheDocument()
        await expect.element(screen.getByText("Save your first restaurant to start a list.")).toBeInTheDocument()
        await expect.element(screen.getByText("No friends yet")).toBeInTheDocument()
    })
})
