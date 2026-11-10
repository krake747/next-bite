import { describe, expect, test } from "vitest"

import { Route } from "@routes/__root"

import fontsCss from "../fonts.css?url"
import appCss from "../index.css?url"

type FontPreload = {
    readonly rel: string
    readonly href: string
    readonly as: string
    readonly type: string
    readonly crossOrigin: string
}

type StylesheetLink = {
    readonly rel: string
    readonly href: string
}

type RootHead = {
    readonly meta: ReadonlyArray<{ readonly name?: string; readonly content?: string }>
    readonly links: ReadonlyArray<FontPreload | StylesheetLink>
}

function rootHead(): RootHead {
    expect(Route.options.head).toBeDefined()
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- spec-only narrowing of the route head fn to its payload
    const head = Route.options.head as unknown as () => RootHead
    return head()
}

describe("root head", () => {
    test("preloads the above-the-fold display and body fonts", () => {
        const links = rootHead().links.filter((link): link is FontPreload => link.rel === "preload")
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

    test("links the global stylesheets", () => {
        const links = rootHead().links.filter((link) => link.rel === "stylesheet")
        expect(links.map((link) => link.href)).toEqual([fontsCss, appCss])
    })

    test("sets one device-width viewport and leaves user zoom alone", () => {
        const viewports = rootHead().meta.filter((meta) => meta.name === "viewport")
        expect(viewports).toEqual([{ name: "viewport", content: "width=device-width, initial-scale=1" }])
    })
})
