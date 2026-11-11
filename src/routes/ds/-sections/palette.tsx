import { Demo } from "./demo-frame"
import { readThemeTokens } from "./theme-tokens"
import { TokenTable, toTokenRows, type TokenDef, type TokenRow } from "./token-table"

export const paletteMeta = {
    id: "palette",
    group: "Tokens",
    title: "Colour palette",
    body: "Tomato and Butter, supported by Basil and Plum on warm Stone neutrals. Components use the semantic tokens; primitives stay reserved for brand graphics.",
    importPath: "src/index.css",
    anatomy: [
        {
            element: "Scale ramps",
            description: "Tomato, Stone, Mango and Basil steps read from the theme; product UI never picks raw steps.",
        },
        {
            element: "Semantic tokens",
            description: "Background, surface, foreground and action tokens that map ramps onto roles.",
        },
    ],
    props: [
        {
            name: "var(--color-*)",
            type: "oklch | var()",
            description: "Raw ramp value from the theme; read through a semantic token.",
        },
        {
            name: "bg-* / text-*",
            type: "utility",
            description:
                "Tailwind utilities that resolve theme colors; swatches below use inline style so docs stay sourced.",
        },
    ],
    variants: [
        { name: "Tomato", description: "Brand action ramp." },
        { name: "Stone", description: "Warm neutrals for surfaces and text." },
        { name: "Mango", description: "Butter accent for highlights." },
        { name: "Basil", description: "Success ramp." },
        { name: "Semantic", description: "Product tokens that map ramps onto roles." },
    ],
    guidance: {
        whenToUse:
            "Use semantic tokens for every surface, text and action; let ramps serve brand graphics and swatches only.",
        whenToAvoid:
            "Do not hardcode ramp classes in product UI; if no semantic token fits, add one instead of reaching for bg-tomato-600.",
        siblings: [
            { id: "typography", reason: "Color and type form the surface together." },
            { id: "shape", reason: "Color and radius form the surface together." },
        ],
    },
} as const

export type PaletteSwatch = {
    readonly label: string
    readonly value: string
}

export type PaletteFamily = {
    readonly name: string
    readonly swatches: ReadonlyArray<PaletteSwatch>
}

const familyOrder: ReadonlyArray<string> = ["tomato", "stone", "mango", "basil"]

function capitalize(family: string): string {
    return family.charAt(0).toUpperCase() + family.slice(1)
}

export function paletteSwatchFamilies(
    tokens: ReadonlyMap<string, string> = readThemeTokens(),
): ReadonlyArray<PaletteFamily> {
    const grouped = new Map<string, { step: number; label: string; value: string }[]>()
    for (const [name, value] of tokens) {
        const match = /^color-([a-z]+)-(\d+)$/.exec(name)
        if (match?.[1] === undefined || match?.[2] === undefined) {
            continue
        }
        const family = match[1]
        const label = match[2]
        if (!familyOrder.includes(family)) {
            continue
        }
        const list = grouped.get(family) ?? []
        list.push({ step: Number(label), label, value })
        grouped.set(family, list)
    }
    return familyOrder
        .filter((family) => grouped.has(family))
        .map((family) => ({
            name: capitalize(family),
            swatches: (grouped.get(family) ?? []).toSorted((a, b) => a.step - b.step),
        }))
}

const themeTokens = readThemeTokens()

const semanticTokens: ReadonlyArray<TokenDef> = [
    { token: "background", name: "color-background", usage: "Page canvas" },
    { token: "surface", name: "color-surface", usage: "Cards, popovers" },
    { token: "surface-muted", name: "color-surface-muted", usage: "Quiet fills, skeletons" },
    { token: "surface-accent", name: "color-surface-accent", usage: "Selected rows" },
    { token: "foreground", name: "color-foreground", usage: "Headings, body" },
    { token: "muted-foreground", name: "color-muted-foreground", usage: "Secondary text, meta" },
    { token: "primary", name: "color-primary", usage: "Main action" },
    { token: "success", name: "color-success", usage: "Been status" },
    { token: "warning", name: "color-warning", usage: "Cautions" },
    { token: "destructive", name: "color-destructive", usage: "Delete" },
    { token: "plum", name: "color-plum", usage: "Second accent, sparing" },
]

export function paletteTokenRows(tokens: ReadonlyMap<string, string> = themeTokens): ReadonlyArray<TokenRow> {
    return toTokenRows(semanticTokens, tokens)
}

export function PaletteDemo() {
    // Swatch fills use inline style from the theme reader. Dynamic bg-* classes would escape Tailwind
    // scanning, so the docs stay sourced without a safelist.
    return (
        <Demo className="grid gap-4 sm:grid-cols-2">
            {paletteSwatchFamilies().map((family) => (
                <div key={family.name}>
                    <p className="mb-2 text-sm font-medium text-foreground">{family.name}</p>
                    <div className="flex overflow-hidden rounded-lg border border-border">
                        {family.swatches.map((swatch) => (
                            <div
                                key={swatch.label}
                                title={`${family.name} ${swatch.label}`}
                                style={{ backgroundColor: swatch.value }}
                                className="h-10 flex-1"
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
                <TokenTable caption="Semantic token usage" rows={paletteTokenRows()} />
            </div>
        </Demo>
    )
}
