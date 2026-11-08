import { Demo } from "./demo-frame"
import { TokenTable } from "./token-table"

export const typographyMeta = {
    id: "typography",
    group: "Tokens",
    title: "Typography",
    body: "Bricolage Grotesque for display, DM Sans for interface. Utilities only; no named display styles.",
    importPath: "src/index.css",
} as const

const typeRows = [
    { token: "font-display", value: "Bricolage · 600", usage: "Page and card titles" },
    { token: "text-body", value: "DM Sans · 400", usage: "Primary copy" },
    { token: "text-sm", value: "14px · 400", usage: "Secondary content" },
    { token: "text-xs", value: "12px · 400", usage: "Timestamps, counts" },
]

export function TypographyDemo() {
    return (
        <Demo className="space-y-4">
            <div className="space-y-3">
                <p className="font-display text-2xl font-semibold text-balance text-foreground">
                    What&apos;s the next bite?
                </p>
                <p className="text-body text-foreground">Good food. Great company.</p>
                <p className="text-sm text-muted-foreground">Body small for secondary content and metadata.</p>
                <p className="text-xs text-muted-foreground">Caption for timestamps and counts.</p>
            </div>
            <TokenTable caption="Type roles" rows={typeRows} />
        </Demo>
    )
}
