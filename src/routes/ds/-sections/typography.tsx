import { Demo } from "./demo-frame"
import { readThemeTokens } from "./theme-tokens"
import { TokenTable, type TokenRow } from "./token-table"

export const typographyMeta = {
    id: "typography",
    group: "Tokens",
    title: "Typography",
    body: "Bricolage Grotesque for display, DM Sans for interface. Utilities only; no named display styles.",
    importPath: "src/index.css",
} as const

const themeTokens = readThemeTokens()

const typeTokens: ReadonlyArray<{ readonly token: string; readonly name: string; readonly usage: string }> = [
    { token: "font-display", name: "font-display", usage: "Page and card titles" },
    { token: "font-sans", name: "font-sans", usage: "Interface copy" },
]

export function typographyTokenRows(tokens: ReadonlyMap<string, string> = themeTokens): ReadonlyArray<TokenRow> {
    return typeTokens.map(({ token, name, usage }) => ({ token, value: tokens.get(name) ?? "", usage }))
}

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
            <TokenTable caption="Type roles" rows={typographyTokenRows()} />
        </Demo>
    )
}
