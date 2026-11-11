import rawThemeCss from "../../../index.css?raw"

export type ThemeToken = {
    readonly name: string
    readonly value: string
}

export const themeCss: string = rawThemeCss

export function parseThemeTokens(css: string): ReadonlyArray<ThemeToken> {
    const block = /@theme[^{]*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? ""
    const tokens: ThemeToken[] = []
    const pattern = /--([\w-]+)\s*:\s*([^;]+);/g
    let match = pattern.exec(block)
    while (match !== null) {
        const name = match[1]
        const raw = match[2]
        if (name !== undefined && raw !== undefined) {
            tokens.push({ name, value: raw.replaceAll(/\s+/g, " ").trim() })
        }
        match = pattern.exec(block)
    }
    return tokens
}

export function readThemeTokens(css: string = themeCss): ReadonlyMap<string, string> {
    return new Map(parseThemeTokens(css).map((token) => [token.name, token.value] as const))
}
