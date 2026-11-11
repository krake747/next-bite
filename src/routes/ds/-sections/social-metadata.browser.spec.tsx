import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { SocialMetadataDemo, socialMetadataMeta } from "./social-metadata"

describe("SocialMetadata design-system section", () => {
    test("points at the pattern with props and guidance", () => {
        expect(socialMetadataMeta.importPath).toBe("src/pattern/social-metadata.tsx")
        expect(socialMetadataMeta.props.map((prop) => prop.name)).toStrictEqual(["ownerName", "wantCount"])
        expect(socialMetadataMeta.guidance.whenToUse.length).toBeGreaterThan(0)
        expect(socialMetadataMeta.guidance.whenToAvoid.length).toBeGreaterThan(0)
    })

    test("renders provenance and demand in human language", async () => {
        const screen = await render(<SocialMetadataDemo />)
        await expect.element(screen.getByText("Added by Alex")).toBeInTheDocument()
        await expect.element(screen.getByText("4 friends want to try")).toBeInTheDocument()
        await expect.element(screen.getByText("Added by Priya")).toBeInTheDocument()
    })
})
