import { describe, expect, test } from "vitest"
import { render } from "vitest-browser-react"

import { expectSectionMeta } from "./section-spec"
import { SocialMetadataDemo, socialMetadataMeta } from "./social-metadata"

describe("SocialMetadata design-system section", () => {
    test("points at the primitive with props and guidance", () => {
        expectSectionMeta(socialMetadataMeta, {
            importPath: "src/pattern/social-metadata.tsx",
            props: ["ownerName", "wantCount"],
        })
        expect(socialMetadataMeta.guidance.whenToAvoid?.length).toBeGreaterThan(0)
    })

    test("renders provenance and demand in human language", async () => {
        const screen = await render(<SocialMetadataDemo />)
        await expect.element(screen.getByText("Added by Alex")).toBeInTheDocument()
        await expect.element(screen.getByText("4 friends want to try")).toBeInTheDocument()
        await expect.element(screen.getByText("Added by Priya")).toBeInTheDocument()
    })
})
