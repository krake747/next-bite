import { expect, test } from "@playwright/test"

const heading = "Your friends have good taste"

// First verb of the loading placeholder. If the server falls back to the
// placeholder shell, its initial render carries this verb instead of the
// landing heading.
const loadingVerb = "Accomplishing"

test("serves the public landing heading in raw HTML", async ({ request }) => {
    const response = await request.get("/")

    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain(heading)
    expect(html).not.toContain(loadingVerb)
})

test("paints the public landing heading", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("heading", { name: heading })).toBeVisible()
})
