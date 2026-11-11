import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { QueryErrorDemo, queryErrorMeta } from "./query-error"

describe("QueryError design-system section", () => {
    test("points at the pattern with props and guidance", () => {
        expect(queryErrorMeta.importPath).toBe("src/pattern/query-error.tsx")
        expect(queryErrorMeta.props.map((prop) => prop.name)).toStrictEqual(["reset"])
        expect(queryErrorMeta.guidance.whenToUse.length).toBeGreaterThan(0)
        expect(queryErrorMeta.guidance.whenToAvoid.length).toBeGreaterThan(0)
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
