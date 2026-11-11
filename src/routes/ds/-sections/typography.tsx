import { Demo } from "./demo-frame"
import { readThemeTokens } from "./theme-tokens"
import { TokenTable, toTokenRows, type TokenDef, type TokenRow } from "./token-table"

export const typographyMeta = {
    id: "typography",
    group: "Tokens",
    title: "Typography",
    body: "Bricolage Grotesque for display, DM Sans for interface. Utilities only; no named display styles.",
    importPath: "src/index.css",
    anatomy: [
        {
            element: "Families",
            description: "Display for titles, sans for interface copy; both read from the theme.",
        },
        {
            element: "Sizes",
            description: "Body, small and caption roles share the sans family at decreasing sizes.",
        },
    ],
    props: [
        {
            name: "font-display",
            type: "utility",
            description: "Display family for page and card titles.",
        },
        {
            name: "text-body / text-sm / text-xs",
            type: "utility",
            description: "Size roles for primary copy, secondary content and captions.",
        },
    ],
    variants: [
        { name: "Display", description: "Page and card titles in Bricolage Grotesque." },
        { name: "Body", description: "Primary copy in DM Sans." },
        { name: "Small", description: "Secondary content and metadata." },
        { name: "Caption", description: "Timestamps and counts." },
    ],
    guidance: {
        whenToUse: "Set titles in display and everything else in sans; step down body, small, caption with intent.",
        whenToAvoid: "Do not introduce weights or families outside the theme; if emphasis is missing, use size first.",
        siblings: [{ id: "palette", reason: "Type and color form the surface together." }],
    },
} as const

const themeTokens = readThemeTokens()

const typeTokens: ReadonlyArray<TokenDef> = [
    { token: "font-display", name: "font-display", usage: "Page and card titles" },
    { token: "text-body", name: "font-sans", usage: "Primary copy" },
    { token: "text-sm", name: "font-sans", usage: "Secondary content and metadata" },
    { token: "text-xs", name: "font-sans", usage: "Timestamps and counts" },
]

export function typographyTokenRows(tokens: ReadonlyMap<string, string> = themeTokens): ReadonlyArray<TokenRow> {
    return toTokenRows(typeTokens, tokens)
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
