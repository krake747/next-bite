import { Card } from "@ui/card"

export const typographyMeta = {
    id: "typography",
    group: "Tokens",
    title: "Typography",
    body: "Bricolage Grotesque for display, DM Sans for interface. Utilities only; no named display styles.",
} as const

export function TypographyDemo() {
    return (
        <Card>
            <div className="w-full space-y-3 p-5">
                <p className="font-display text-2xl font-semibold text-balance text-stone-900">
                    What&apos;s the next bite?
                </p>
                <p className="text-body text-stone-700">Good food. Great company.</p>
                <p className="text-sm text-stone-600">Body small for secondary content and metadata.</p>
                <p className="text-xs text-stone-600">Caption for timestamps and counts.</p>
            </div>
        </Card>
    )
}
