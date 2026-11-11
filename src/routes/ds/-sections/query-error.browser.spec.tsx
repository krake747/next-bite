import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { QueryErrorDemo, queryErrorMeta } from "./query-error"
import { expectSectionMeta } from "./section-spec"

describe("QueryError design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(queryErrorMeta, {
            importPath: "src/pattern/query-error.tsx",
            props: ["reset"],
        })
        expect(queryErrorMeta.guidance.whenToAvoid?.length).toBeGreaterThan(0)
    })

    test("renders the failure with one way back", async () => {
        const screen = await render(<QueryErrorDemo />)
        await expect.element(screen.getByText("Could not load this page")).toBeInTheDocument()
        await expect
            .element(screen.getByText("The request failed. Check your connection and try again."))
            .toBeInTheDocument()
        await expect.element(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
    })
})
