import { describe, expect, test } from "vitest"

import { Route } from "@routes/__root"

type FontPreload = {
    readonly rel: string
    readonly href: string
    readonly as: string
    readonly type: string
    readonly crossOrigin: string
}

describe("root head", () => {
    test("preloads the above-the-fold display and body fonts", () => {
        expect(Route.options.head).toBeDefined()
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- spec-only narrowing of the route head fn to its links payload
        const head = Route.options.head as unknown as () => { links: ReadonlyArray<FontPreload> }
        const links = head().links
        expect(links).toHaveLength(2)
        expect(links.map((link) => `${link.rel} ${link.as} ${link.type} ${link.crossOrigin}`)).toEqual([
            "preload font font/woff2 anonymous",
            "preload font font/woff2 anonymous",
        ])
        const hrefs = links.map((link) => link.href).join(" ")
        expect(hrefs).toContain("bricolage")
        expect(hrefs).toContain("dm-sans")
        expect(hrefs).toMatch(/\.woff2/)
    })
})
