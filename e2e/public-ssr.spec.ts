import { expect, test } from "@playwright/test"

const heading = "Your friends have good taste"

// First verb of the loading placeholder. If the server falls back to the
// placeholder shell, its initial render carries a loading status instead of
// the landing heading.
const loadingFallback = 'role="status"'

test("serves the public landing heading in raw HTML", async ({ request }) => {
    const response = await request.get("/")

    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain(heading)
    expect(html).not.toContain(loadingFallback)
})

test("serves the design system heading in raw HTML", async ({ request }) => {
    const response = await request.get("/ds")

    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain("Design system")
    expect(html).not.toContain(loadingFallback)
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
