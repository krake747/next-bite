import { Card } from "@ui/card"

import { Demo } from "./demo-frame"

export const cardMeta = {
    id: "card",
    group: "Components",
    title: "Card",
    body: "The default container for grouped content. One radius, one border, one soft shadow everywhere.",
    importPath: "src/ui/card.tsx",
    anatomy: [
        {
            element: "Card",
            description: "A rounded surface that stacks its children vertically and clips overflow.",
        },
    ],
    props: [
        {
            name: "children",
            type: "React.ReactNode",
            description: "The grouped content, usually padded sections.",
        },
        {
            name: "className",
            type: "string",
            description: "Extra classes merged onto the surface, such as padding.",
        },
    ],
    guidance: {
        whenToUse: "Group related content that belongs together on a page or in a list.",
        whenToAvoid: "Do not nest cards; split the group instead of stacking surfaces.",
    },
} as const

export function CardDemo() {
    return (
        <Demo>
            <Card className="max-w-sm">
                <div className="p-5">
                    <p className="font-display text-lg font-semibold text-foreground">Sunday supper club</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Six friends, one long table, and a place that does not rush dessert.
                    </p>
                </div>
            </Card>
        </Demo>
    )
}
