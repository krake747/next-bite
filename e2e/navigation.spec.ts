import { expect, test, type Page } from "@playwright/test"

function collectPageErrors(page: Page): unknown[] {
    const errors: unknown[] = []
    page.on("pageerror", (error) => {
        errors.push(error)
    })
    return errors
}

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
