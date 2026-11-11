import { Badge } from "@ui/badge"

import { Demo } from "./demo-frame"

export const badgeMeta = {
    id: "badge",
    group: "Components",
    title: "Badge",
    body: "A small status or category mark. Tones carry meaning at a glance; the text stays short.",
    importPath: "src/ui/badge.tsx",
    anatomy: [
        {
            element: "Badge",
            description: "A rounded pill that exposes its tone as data-variant for styling and tests.",
        },
    ],
    props: [
        {
            name: "tone",
            type: '"neutral" | "brand" | "success" | "accent" | "outline"',
            default: '"neutral"',
            description: "Meaning of the mark, rendered as data-variant.",
        },
        {
            name: "children",
            type: "React.ReactNode",
            description: "One or two words. Never a sentence.",
        },
        {
            name: "className",
            type: "string",
            description: "Extra classes merged onto the pill.",
        },
    ],
    variants: [
        { name: "neutral", description: "Default metadata such as counts and categories." },
        { name: "brand", description: "Something to try, the house recommendation." },
        { name: "success", description: "A settled state such as visited or confirmed." },
        { name: "accent", description: "A highlight that is neither brand nor success." },
        { name: "outline", description: "Quiet metadata on busy surfaces." },
    ],
    guidance: {
        whenToUse:
            "Label status or category inline where a full row would be too much. Pick the tone by meaning: neutral for metadata, brand for the house pick, success for settled states, accent for highlights, outline on busy surfaces.",
        whenToAvoid:
            "Do not use for actions or navigation; badges are read-only marks, so buttons and links keep their own primitives. Never invent a color with className; if no tone fits, the design needs a new tone, not a one-off.",
        siblings: [{ id: "button", reason: "Actions use Button, read-only marks use Badge." }],
    },
} as const

export function BadgeDemo() {
    return (
        <Demo>
            <div className="flex flex-wrap gap-2">
                <Badge tone="neutral">Saved</Badge>
                <Badge tone="brand">Want to try</Badge>
                <Badge tone="success">Been there</Badge>
                <Badge tone="accent">New</Badge>
                <Badge tone="outline">12 spots</Badge>
            </div>
        </Demo>
    )
}
