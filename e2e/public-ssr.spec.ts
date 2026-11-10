import { expect, test, type TestInfo } from "@playwright/test"

const heading = "Your friends have good taste"

const loadingFallback = 'role="status"'

type LayoutElement = {
    readonly ownerDocument: unknown
}

declare const window: {
    readonly innerWidth: number
    readonly visualViewport: { readonly scale: number } | null
}

declare const document: {
    readonly documentElement: { readonly scrollWidth: number; readonly clientWidth: number }
    querySelector(selector: string): LayoutElement | null
}

declare function getComputedStyle(element: LayoutElement): { readonly flexDirection: string }

type LandingLayout = {
    readonly innerWidth: number
    readonly scrollWidth: number
    readonly clientWidth: number
    readonly scale: number
    readonly closerDirection: string
}

function viewportTags(html: string): string[] {
    const tags = html.match(/<meta\b[^>]*>/gi)
    if (tags === null) {
        return []
    }
    return tags.filter((tag) => /\bname=["']viewport["']/i.test(tag))
}

function soleViewport(html: string): string {
    const tags = viewportTags(html)
    expect(tags).toHaveLength(1)
    const tag = tags[0]
    if (tag === undefined) {
        throw new Error("viewport meta tag is missing")
    }
    return tag
}

function expectEmulation(testInfo: TestInfo): void {
    if (testInfo.project.name === "mobile") {
        expect(testInfo.project.use.isMobile).toBe(true)
        expect(testInfo.project.use.hasTouch).toBe(true)
        expect(testInfo.project.use.deviceScaleFactor).toBeGreaterThan(1)
        return
    }
    if (testInfo.project.name === "desktop") {
        expect(testInfo.project.use.isMobile).not.toBe(true)
    }
}

function requireViewport(
    size: Readonly<{ width: number; height: number }> | null,
): Readonly<{ width: number; height: number }> {
    expect(size).not.toBeNull()
    if (size === null) {
        throw new Error("viewport is missing")
    }
    return size
}

function closerDirectionForWidth(width: number): string {
    if (width < 640) {
        return "column"
    }
    return "row"
}

function readLandingLayout(): LandingLayout {
    const closer = document.querySelector('[aria-label="Get started"] > div')
    let closerDirection = ""
    if (closer !== null) {
        closerDirection = getComputedStyle(closer).flexDirection
    }
    let scale = 1
    if (window.visualViewport !== null) {
        scale = window.visualViewport.scale
    }
    return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        scale,
        closerDirection,
    }
}

function expectReadableCta(box: Readonly<{ height: number }> | null): void {
    expect(box).not.toBeNull()
    if (box === null) {
        throw new Error("signup call to action has no box")
    }
    expect(box.height).toBeGreaterThanOrEqual(40)
}

test("serves the public landing heading in raw HTML", async ({ request }) => {
    const response = await request.get("/")

    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain(heading)
    expect(html).toContain("Get started")
    expect(html).toContain("Sign In")
    expect(html).toContain("bricolage")
    expect(html).toContain("dm-sans")
    expect(html).not.toContain(loadingFallback)
    expect(html).not.toContain('data-slot="app-nav"')
    const viewport = soleViewport(html)
    expect(viewport).toContain("width=device-width")
    expect(viewport).toContain("initial-scale=1")
    expect(viewport).not.toMatch(/user-scalable\s*=\s*["']?(?:no|0)/i)
    expect(viewport).not.toMatch(/maximum-scale\s*=\s*["']?1(?:\.0+)?(?:"|'|\s|\/|>)/i)
})

test("lays the public landing out at the real viewport width", async ({ page }, testInfo) => {
    expectEmulation(testInfo)
    await page.goto("/")
    await expect(page.getByRole("heading", { name: heading })).toBeVisible()

    const configured = requireViewport(page.viewportSize())
    const layout: LandingLayout = await page.evaluate(readLandingLayout)
    expect(layout.innerWidth).toBe(configured.width)
    expect(layout.scale).toBeGreaterThan(0.99)
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1)
    expect(layout.closerDirection).toBe(closerDirectionForWidth(configured.width))

    const cta = page.getByRole("link", { name: "Get started" }).first()
    await expect(cta).toBeVisible()
    expectReadableCta(await cta.boundingBox())
})

test("serves the design system heading in raw HTML", async ({ request }) => {
    const response = await request.get("/ds")

    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain("Design system")
    expect(html).toContain("Sign in")
})

test("serves stub headings in raw HTML", async ({ request }) => {
    for (const [path, name] of [
        ["/friends", "Friends"],
        ["/groups", "Groups"],
        ["/you", "You"],
    ] as const) {
        const response = await request.get(path)

        expect(response.ok()).toBe(true)
        const html = await response.text()
        expect(html).toContain(name)
    }
})

test("paints the public landing heading", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("heading", { name: heading })).toBeVisible()
})
