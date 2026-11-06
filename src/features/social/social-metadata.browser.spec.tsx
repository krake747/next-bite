import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"

import { SocialMetadata } from "./social-metadata"

describe("SocialMetadata", () => {
    test("speaks in human language, not database terms", () => {
        render(<SocialMetadata ownerName="Alex" wantCount={4} beenCount={1} />)
        expect(screen.getByText("Added by Alex")).toBeInTheDocument()
        expect(screen.getByText("4 friends want to try")).toBeInTheDocument()
        expect(screen.getByText("Visited by a friend")).toBeInTheDocument()
    })

    test("renders nothing without social context", () => {
        const { container } = render(<SocialMetadata />)
        expect(container).toBeEmptyDOMElement()
    })
})
