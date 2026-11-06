import { expect, test, type Page } from "@playwright/test"

function collectPageErrors(page: Page): unknown[] {
    const errors: unknown[] = []
    page.on("pageerror", (error) => {
        errors.push(error)
    })
    return errors
}

// The primary nav renders for signed-in users only, and the Worker preview has no password
// auth, so anonymous legs navigate directly. Signed-in nav clicks are covered by the
// authenticated journeys on the dev server.
test("visits Home to Friends to Groups without page errors", async ({ page }) => {
    const errors = collectPageErrors(page)

    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Your friends have good taste" })).toBeVisible()
    await page.waitForLoadState("networkidle")

    await page.goto("/friends")
    await expect(page.getByRole("heading", { name: "Friends" })).toBeVisible()
    await page.waitForLoadState("networkidle")

    await page.goto("/groups")
    await expect(page.getByRole("heading", { name: "Groups" })).toBeVisible()
    await page.waitForLoadState("networkidle")

    expect(errors).toEqual([])
})
