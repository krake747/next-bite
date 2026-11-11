import { Demo } from "./demo-frame"
import { readThemeTokens } from "./theme-tokens"
import { TokenTable, type TokenRow } from "./token-table"

export const shapeMeta = {
    id: "shape",
    group: "Tokens",
    title: "Shape and elevation",
    body: "Restrained radius per surface, borders over heavy shadows, warm-tinted elevations.",
    importPath: "src/index.css",
} as const

const themeTokens = readThemeTokens()

const radiusTokens: ReadonlyArray<{ readonly token: string; readonly name: string; readonly usage: string }> = [
    { token: "rounded-control", name: "radius-control", usage: "Buttons, inputs, rows" },
    { token: "rounded-panel", name: "radius-panel", usage: "Panels, sheets" },
    { token: "rounded-card", name: "radius-card", usage: "Cards" },
    { token: "rounded-dialog", name: "radius-dialog", usage: "Dialogs" },
]

export function shapeTokenRows(tokens: ReadonlyMap<string, string> = themeTokens): ReadonlyArray<TokenRow> {
    return radiusTokens.map(({ token, name, usage }) => ({ token, value: tokens.get(name) ?? "", usage }))
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
