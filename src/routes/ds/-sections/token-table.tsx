import { type Guidance, type PropRow, type VariantRow } from "./registry"

export type TokenRow = {
    readonly token: string
    readonly value: string
    readonly usage: string
}

export type TokenDef = {
    readonly token: string
    readonly name: string
    readonly usage: string
}

export function toTokenRows(
    defs: ReadonlyArray<TokenDef>,
    tokens: ReadonlyMap<string, string>,
): ReadonlyArray<TokenRow> {
    return defs.map(({ token, name, usage }) => ({ token, value: tokens.get(name) ?? "", usage }))
}

export function PropsTable({ rows, caption }: Readonly<{ rows: ReadonlyArray<PropRow>; caption: string }>) {
    return (
        <table data-slot="props-table" className="w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
                <tr className="text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                        Prop
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                        Type
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                        Default
                    </th>
                    <th scope="col" className="py-2 font-medium">
                        Description
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.name} className="border-t border-border">
                        <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap text-foreground">{row.name}</td>
                        <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                            {row.type}
                        </td>
                        <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                            {row.default ?? ""}
                        </td>
                        <td className="py-2 text-muted-foreground">{row.description}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export function VariantTable({ rows, caption }: Readonly<{ rows: ReadonlyArray<VariantRow>; caption: string }>) {
    return (
        <table data-slot="variant-table" className="w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
                <tr className="text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                        Variant
                    </th>
                    <th scope="col" className="py-2 font-medium">
                        Description
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.name} className="border-t border-border">
                        <td className="py-2 pr-4 whitespace-nowrap text-foreground">{row.name}</td>
                        <td className="py-2 text-muted-foreground">{row.description}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export type AnatomyRow = {
    readonly element: string
    readonly description: string
}

export function AnatomyTable({ rows, caption }: Readonly<{ rows: ReadonlyArray<AnatomyRow>; caption: string }>) {
    return (
        <table data-slot="anatomy-table" className="w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
                <tr className="text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                        Element
                    </th>
                    <th scope="col" className="py-2 font-medium">
                        Description
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.element} className="border-t border-border">
                        <td className="py-2 pr-4 whitespace-nowrap text-foreground">{row.element}</td>
                        <td className="py-2 text-muted-foreground">{row.description}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export function practiceRows(guidance: Guidance): ReadonlyArray<PracticeRow> {
    return [
        { kind: "do" as const, text: guidance.whenToUse },
        ...(guidance.whenToAvoid === undefined ? [] : [{ kind: "dont" as const, text: guidance.whenToAvoid }]),
    ]
}

export type PracticeRow = {
    readonly kind: "do" | "dont"
    readonly text: string
}

export function PracticesTable({ rows, caption }: Readonly<{ rows: ReadonlyArray<PracticeRow>; caption: string }>) {
    return (
        <table data-slot="practices-table" className="w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
                <tr className="text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                        Guidance
                    </th>
                    <th scope="col" className="py-2 font-medium">
                        Practices
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.kind} className="border-t border-border">
                        <td className="py-2 pr-4 whitespace-nowrap">
                            {row.kind === "do" ? (
                                <span className="rounded-full bg-success px-3 py-1 text-xs text-inverse">Do</span>
                            ) : (
                                <span className="rounded-full bg-destructive px-3 py-1 text-xs text-inverse">
                                    Don&apos;t
                                </span>
                            )}
                        </td>
                        <td className="py-2 text-muted-foreground">{row.text}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}

export function TokenTable({ rows, caption }: Readonly<{ rows: ReadonlyArray<TokenRow>; caption: string }>) {
    return (
        <table data-slot="token-table" className="w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead>
                <tr className="text-xs text-muted-foreground">
                    <th scope="col" className="py-2 pr-4 font-medium">
                        Token
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                        Value
                    </th>
                    <th scope="col" className="py-2 font-medium">
                        Use
                    </th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={row.token} className="border-t border-border">
                        <td className="py-2 pr-4 font-mono text-xs whitespace-nowrap text-foreground">{row.token}</td>
                        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground tabular-nums">{row.value}</td>
                        <td className="py-2 text-muted-foreground">{row.usage}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
