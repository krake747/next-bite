import { TextLink } from "@ui/text-link"

import { Demo } from "./demo-frame"

export const textLinkMeta = {
    id: "text-link",
    group: "Components",
    title: "Text link",
    body: "Navigation inside a sentence. Brand colored and semibold, with an underline on hover.",
    importPath: "src/ui/text-link.tsx",
    anatomy: [
        {
            element: "TextLink",
            description: "An anchor by default, or any element through render with link styling.",
        },
    ],
    props: [
        {
            name: "href",
            type: "string",
            description: "Where the link goes in the default anchor case.",
        },
        {
            name: "render",
            type: "React.ReactElement",
            description: "Renders a router link with link styling instead of an anchor.",
        },
        {
            name: "className",
            type: "string",
            description: "Extra classes merged onto the link.",
        },
    ],
    guidance: {
        whenToUse: "Send the user somewhere from inside a sentence or a short paragraph.",
        whenToAvoid: "Do not use for actions; buttons act, links go. Standalone calls to action get a Button.",
    },
} as const

export function TextLinkDemo() {
    return (
        <Demo>
            <p className="text-sm text-foreground">
                Priya saved three spots for Friday. <TextLink href="/lists">See the list</TextLink> and pick one before
                noon.
            </p>
        </Demo>
    )
}
