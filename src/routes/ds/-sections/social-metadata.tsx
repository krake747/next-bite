import { SocialMetadata } from "@pattern/social-metadata"

import { Demo } from "./demo-frame"

export const socialMetadataMeta = {
    id: "social-metadata",
    group: "Patterns",
    title: "Social Metadata",
    body: "Who stands behind a restaurant. Owner credit and friend demand in human language, so a card answers why this place matters.",
    importPath: "src/pattern/social-metadata.tsx",
    props: [
        {
            name: "ownerName",
            type: "string",
            description: "The friend who added the restaurant. Omit it when the owner is unknown.",
        },
        {
            name: "wantCount",
            type: "number | string",
            description: "How many friends want to try it. Omit it when nobody has said so yet.",
        },
    ],
    guidance: {
        whenToUse:
            "Use under a restaurant name or card to show provenance and demand. The pattern renders nothing when both are missing.",
        whenToAvoid:
            "Do not invent context when there is none; an empty render beats a generic line. No database words in the copy.",
        siblings: [{ id: "avatar", reason: "Show who with Avatar, show provenance with SocialMetadata." }],
    },
} as const

export function SocialMetadataDemo() {
    return (
        <Demo className="space-y-4">
            <SocialMetadata ownerName="Alex" wantCount={4} />
            <SocialMetadata ownerName="Priya" />
        </Demo>
    )
}
