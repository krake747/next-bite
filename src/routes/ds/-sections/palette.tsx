import { cx } from "@ui/cva.config"

import { Demo } from "./demo-frame"
import { TokenTable } from "./token-table"

export const paletteMeta = {
    id: "palette",
    group: "Tokens",
    title: "Colour palette",
    body: "Tomato and Butter, supported by Basil and Plum on warm Stone neutrals. Components use the semantic tokens; primitives stay reserved for brand graphics.",
    importPath: "src/index.css",
} as const

const palette: ReadonlyArray<{ name: string; swatches: ReadonlyArray<{ label: string; className: string }> }> = [
    {
        name: "Tomato",
        swatches: [
            { label: "50", className: "bg-tomato-50" },
            { label: "100", className: "bg-tomato-100" },
            { label: "200", className: "bg-tomato-200" },
            { label: "300", className: "bg-tomato-300" },
            { label: "400", className: "bg-tomato-400" },
            { label: "500", className: "bg-tomato-500" },
            { label: "600", className: "bg-tomato-600" },
            { label: "700", className: "bg-tomato-700" },
            { label: "800", className: "bg-tomato-800" },
            { label: "900", className: "bg-tomato-900" },
        ],
    },
    {
        name: "Stone",
        swatches: [
            { label: "50", className: "bg-stone-50" },
            { label: "100", className: "bg-stone-100" },
            { label: "200", className: "bg-stone-200" },
            { label: "300", className: "bg-stone-300" },
            { label: "400", className: "bg-stone-400" },
            { label: "500", className: "bg-stone-500" },
            { label: "600", className: "bg-stone-600" },
            { label: "700", className: "bg-stone-700" },
            { label: "800", className: "bg-stone-800" },
            { label: "900", className: "bg-stone-900" },
        ],
    },
    {
        name: "Mango",
        swatches: [
            { label: "50", className: "bg-mango-50" },
            { label: "100", className: "bg-mango-100" },
            { label: "200", className: "bg-mango-200" },
            { label: "300", className: "bg-mango-300" },
            { label: "400", className: "bg-mango-400" },
            { label: "500", className: "bg-mango-500" },
            { label: "600", className: "bg-mango-600" },
        ],
    },
    {
        name: "Basil",
        swatches: [
            { label: "50", className: "bg-basil-50" },
            { label: "100", className: "bg-basil-100" },
            { label: "200", className: "bg-basil-200" },
            { label: "300", className: "bg-basil-300" },
            { label: "400", className: "bg-basil-400" },
            { label: "500", className: "bg-basil-500" },
            { label: "600", className: "bg-basil-600" },
        ],
    },
]

const semanticRows = [
    { token: "background", value: "stone-100", usage: "Page canvas" },
    { token: "surface", value: "white", usage: "Cards, popovers" },
    { token: "surface-muted", value: "stone-200", usage: "Quiet fills, skeletons" },
    { token: "surface-accent", value: "mango-100", usage: "Selected rows" },
    { token: "foreground", value: "stone-900", usage: "Headings, body" },
    { token: "muted-foreground", value: "stone-600", usage: "Secondary text, meta" },
    { token: "primary", value: "tomato-600", usage: "Main action" },
    { token: "success", value: "basil-600", usage: "Been status" },
    { token: "warning", value: "mango-600", usage: "Cautions" },
    { token: "destructive", value: "oklch red", usage: "Delete" },
    { token: "plum", value: "oklch violet", usage: "Second accent, sparing" },
]

export function PaletteDemo() {
    return (
        <Demo className="grid gap-4 sm:grid-cols-2">
            {palette.map((family) => (
                <div key={family.name}>
                    <p className="mb-2 text-sm font-medium text-foreground">{family.name}</p>
                    <div className="flex overflow-hidden rounded-lg border border-border">
                        {family.swatches.map((swatch) => (
                            <div
                                key={swatch.label}
                                title={`${family.name} ${swatch.label}`}
                                className={cx("h-10 flex-1", swatch.className)}
                            />
                        ))}
                    </div>
                </div>
            ))}
            <div>
                <p className="mb-2 text-sm font-medium text-foreground">Semantic tokens</p>
                <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-background px-3 py-1 text-xs ring-1 ring-border">background</span>
                    <span className="rounded-full bg-surface px-3 py-1 text-xs ring-1 ring-border">surface</span>
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-xs">surface-muted</span>
                    <span className="rounded-full bg-surface-accent px-3 py-1 text-xs">surface-accent</span>
                    <span className="rounded-full bg-primary px-3 py-1 text-xs text-inverse">primary</span>
                    <span className="rounded-full bg-success px-3 py-1 text-xs text-inverse">success</span>
                    <span className="rounded-full bg-warning px-3 py-1 text-xs text-inverse">warning</span>
                    <span className="rounded-full bg-destructive px-3 py-1 text-xs text-inverse">destructive</span>
                    <span className="rounded-full bg-plum px-3 py-1 text-xs text-inverse">plum accent</span>
                </div>
            </div>
            <div className="sm:col-span-2">
                <TokenTable caption="Semantic token usage" rows={semanticRows} />
            </div>
        </Demo>
    )
}
