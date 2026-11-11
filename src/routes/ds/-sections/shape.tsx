import { Demo } from "./demo-frame"
import { readThemeTokens } from "./theme-tokens"
import { TokenTable, toTokenRows, type TokenDef, type TokenRow } from "./token-table"

export const shapeMeta = {
    id: "shape",
    group: "Tokens",
    title: "Shape and elevation",
    body: "Restrained radius per surface, borders over heavy shadows, warm-tinted elevations.",
    importPath: "src/index.css",
    anatomy: [
        {
            element: "Radius scale",
            description: "Control, panel, card and dialog radii from the theme; one radius per surface.",
        },
        {
            element: "Elevation",
            description:
                "Card, popover and dialog shadows from the theme; borders carry the edge, shadows carry depth.",
        },
    ],
    props: [
        {
            name: "rounded-*",
            type: "utility",
            description: "Radius utility that resolves a --radius-* token.",
        },
        {
            name: "shadow-*",
            type: "utility",
            description: "Elevation utility that resolves a --shadow-* token.",
        },
    ],
    variants: [
        { name: "Radius", description: "Control, panel, card and dialog surfaces." },
        { name: "Shadow", description: "Card, popover and dialog elevations." },
    ],
    guidance: {
        whenToUse:
            "Keep one radius per surface and let borders carry the edge; add shadow only when the surface floats.",
        whenToAvoid:
            "Do not invent radii or stack shadows for emphasis; if the surface needs more weight, move up one scale step.",
        siblings: [{ id: "palette", reason: "Radius and color form the surface together." }],
    },
} as const

const themeTokens = readThemeTokens()

const shapeTokens: ReadonlyArray<TokenDef> = [
    { token: "rounded-control", name: "radius-control", usage: "Buttons, inputs, rows" },
    { token: "rounded-panel", name: "radius-panel", usage: "Panels, sheets" },
    { token: "rounded-card", name: "radius-card", usage: "Cards" },
    { token: "rounded-dialog", name: "radius-dialog", usage: "Dialogs" },
    { token: "shadow-card", name: "shadow-card", usage: "Resting elevation" },
    { token: "shadow-popover", name: "shadow-popover", usage: "Floating panels" },
    { token: "shadow-dialog", name: "shadow-dialog", usage: "Modal elevation" },
]

export function shapeTokenRows(tokens: ReadonlyMap<string, string> = themeTokens): ReadonlyArray<TokenRow> {
    return toTokenRows(shapeTokens, tokens)
}

export function ShapeDemo() {
    return (
        <Demo className="space-y-4">
            <div className="flex flex-wrap gap-3">
                <div className="rounded-control border border-border bg-surface px-4 py-2 text-sm">control 10px</div>
                <div className="rounded-panel border border-border bg-surface px-4 py-2 text-sm">panel 14px</div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm">card 16px</div>
                <div className="rounded-dialog border border-border bg-surface px-4 py-2 text-sm">dialog 20px</div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-card">
                    card shadow
                </div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-popover">
                    popover shadow
                </div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-dialog">
                    dialog shadow
                </div>
            </div>
            <TokenTable caption="Radius tokens" rows={shapeTokenRows()} />
        </Demo>
    )
}
