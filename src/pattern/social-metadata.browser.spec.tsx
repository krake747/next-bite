import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { SocialMetadata } from "./social-metadata"

describe("SocialMetadata", () => {
    test("speaks in human language, not database terms", async () => {
        const screen = await render(<SocialMetadata ownerName="Alex" wantCount={4} />)
        await expect.element(screen.getByText("Added by Alex")).toBeInTheDocument()
        await expect.element(screen.getByText("4 friends want to try")).toBeInTheDocument()
    })

    test("renders nothing without social context", async () => {
        const screen = await render(<SocialMetadata />)
        expect(screen.container).toBeEmptyDOMElement()
    })
})
