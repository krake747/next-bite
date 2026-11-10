import { expect, test, type Page } from "@playwright/test"

const unknownRestaurantId = "j97abcdefghijklmnopqrstuvwxyz0"

const restaurantMarkers = ["Why it", "Join the conversation"]

function collectPageErrors(page: Page): unknown[] {
    const errors: unknown[] = []
    page.on("pageerror", (error) => {
        errors.push(error)
    })
    return errors
}

test("serves a content-free shell for anonymous restaurant detail", async ({ request }) => {
    const response = await request.get(`/restaurants/${unknownRestaurantId}`)

    expect(response.ok()).toBe(true)
    const html = await response.text()
    expect(html).toContain("Loading…")
    expect(html).toContain("<title>Restaurant details</title>")
    for (const marker of restaurantMarkers) {
        expect(html).not.toContain(marker)
    }
})

test("paints no private content for anonymous restaurant detail", async ({ page }) => {
    const errors = collectPageErrors(page)

    await page.goto(`/restaurants/${unknownRestaurantId}`)

    await expect(page.getByText("Why it's recommended")).toHaveCount(0)
    await expect(page.getByText("Spot not found").or(page.getByText("Loading…"))).toBeVisible()
    expect(errors).toEqual([])
})
