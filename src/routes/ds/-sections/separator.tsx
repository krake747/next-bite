import { Separator } from "@ui/separator"

import { Demo } from "./demo-frame"

export const separatorMeta = {
    id: "separator",
    group: "Components",
    title: "Separator",
    body: "A quiet line between groups. Decorative by default; only name it when it structures the content.",
    importPath: "src/ui/separator.tsx",
    anatomy: [
        {
            element: "Separator",
            description: "A 1px line that stretches across its axis and stays out of the tab order.",
        },
    ],
    props: [
        {
            name: "orientation",
            type: '"horizontal" | "vertical"',
            default: '"horizontal"',
            description: "Direction of the line. Vertical separators need a sized parent.",
        },
    ],
    variants: [
        { name: "horizontal", description: "Stacks between rows of content." },
        { name: "vertical", description: "Stands between columns in a flex row." },
    ],
    guidance: {
        whenToUse:
            "Divide stacked or side-by-side groups that share a surface. Horizontal stacks rows, vertical stands between columns in a flex row.",
        whenToAvoid:
            "Do not use for spacing alone; space comes from layout, not lines. Do not draw the line with borders or custom divs; Separator owns the 1px line and stays out of the tab order.",
        siblings: [{ id: "card", reason: "Group content in Card, divide it with Separator." }],
    },
} as const

export function SeparatorDemo() {
    return (
        <Demo>
            <div className="space-y-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Your lists</p>
                    <Separator />
                    <p className="text-sm text-muted-foreground">Shared with you</p>
                </div>
                <div className="flex h-10 items-center gap-4">
                    <p className="text-sm text-foreground">Open now</p>
                    <Separator orientation="vertical" />
                    <p className="text-sm text-foreground">Within a mile</p>
                    <Separator orientation="vertical" />
                    <p className="text-sm text-foreground">Under $30</p>
                </div>
            </div>
        </Demo>
    )
}
