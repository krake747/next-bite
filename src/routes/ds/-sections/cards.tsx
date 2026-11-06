import { getSchema } from "cva/tools"

import { Badge, badge } from "@ui/badge"
import { Card } from "@ui/card"
import { Skeleton } from "@ui/skeleton"

export const cardsMeta = {
    id: "cards",
    group: "Content",
    title: "Cards and badges",
    body: "Cards stay white on cream with one border and one quiet shadow. Badges are restrained labels: Tomato for want, Basil for been, never colour alone.",
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
        <Card>
            <div className="flex flex-wrap items-center gap-3 p-5">
                <Card className="max-w-sm">
                    <div className="p-4">
                        <p className="font-display text-lg font-semibold text-balance text-stone-900">Card default</p>
                        <p className="mt-1 text-sm text-pretty text-stone-600">
                            White surface, Stone border, card shadow.
                        </p>
                    </div>
                </Card>
                <div className="flex flex-wrap gap-2">
                    {badgeSchema.tone.values.map((tone) => (
                        <Badge key={tone} tone={tone}>
                            {badgeLabels[tone] ?? tone}
                        </Badge>
                    ))}
                </div>
                <Skeleton className="h-16 w-48" />
            </div>
        </Card>
    )
}
