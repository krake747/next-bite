import { getSchema } from "cva/tools"

import { Badge, badge } from "@ui/badge"
import { Card } from "@ui/card"
import { Skeleton } from "@ui/skeleton"

import { Demo } from "./demo-frame"

export const cardsMeta = {
    id: "cards",
    group: "Content",
    title: "Cards and badges",
    body: "Cards stay white on cream with one border and one quiet shadow. Badges are restrained labels: Tomato for want, Basil for been, never colour alone.",
    importPath: "@ui/card · @ui/badge · @ui/skeleton",
    anatomy: [
        { element: "Card", description: "The surface. One border, one quiet shadow." },
        { element: "Badge", description: "A restrained status label, never colour alone." },
        { element: "Skeleton", description: "A placeholder that holds layout while loading." },
    ],
    children: [
        { id: "card", title: "Card" },
        { id: "badge", title: "Badge" },
        { id: "skeleton", title: "Skeleton" },
    ],
} as const

const badgeSchema = getSchema(badge)

const badgeLabels: Record<string, string> = {
    neutral: "neutral",
    brand: "Want to try",
    success: "Been there",
    accent: "Pizza Lovers",
}

export function CardsDemo() {
    return (
        <Demo className="space-y-6">
            <div id="card" role="group" aria-label="Card">
                <Card className="max-w-sm">
                    <div className="p-4">
                        <p className="font-display text-lg font-semibold text-balance text-foreground">Card default</p>
                        <p className="mt-1 text-sm text-pretty text-muted-foreground">
                            White surface, Stone border, card shadow.
                        </p>
                    </div>
                </Card>
            </div>
            <div id="badge" role="group" aria-label="Badge" className="flex flex-wrap gap-2">
                {badgeSchema.tone.values.map((tone) => (
                    <Badge key={tone} tone={tone}>
                        {badgeLabels[tone] ?? tone}
                    </Badge>
                ))}
            </div>
            <div id="skeleton" role="group" aria-label="Skeleton">
                <Skeleton className="h-16 w-48" />
            </div>
        </Demo>
    )
}
