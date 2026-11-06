import { expect, test, type Page } from "@playwright/test"

function collectPageErrors(page: Page): unknown[] {
    const errors: unknown[] = []
    page.on("pageerror", (error) => {
        errors.push(error)
    })
    return errors
}

test("navigates Home to Friends to Groups without page errors", async ({ page }) => {
    const errors = collectPageErrors(page)

    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Your friends have good taste" })).toBeVisible()

    await page.getByRole("link", { name: "Friends" }).click()
    await expect(page).toHaveURL(/\/friends$/, { timeout: 15000 })
    await expect(page.getByRole("heading", { name: "Friends" })).toBeVisible()
    await page.waitForLoadState("networkidle")

    await page.getByRole("link", { name: "Groups" }).click()
    await expect(page).toHaveURL(/\/groups$/, { timeout: 15000 })
    await expect(page.getByRole("heading", { name: "Groups" })).toBeVisible()

    expect(errors).toEqual([])
})
