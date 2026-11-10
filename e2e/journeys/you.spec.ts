import { expect, test } from "@playwright/test"

test("profile edit, save, and want-state updates", async ({ page }) => {
    const stamp = Date.now()
    const email = `e2e-you-${stamp}@example.com`
    const placeName = `E2E You Diner ${stamp}`
    const errors: unknown[] = []
    page.on("pageerror", (error) => {
        errors.push(error)
    })
    await page.route("**/maps.googleapis.com/**", (route) => {
        void route.abort()
    })

    await page.goto("/signup")
    await page.getByLabel("Name").fill(`You ${stamp}`)
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password", { exact: true }).fill("E2e-test-123")
    await page.getByLabel("Confirm password").fill("E2e-test-123")
    await page.getByRole("button", { name: "Create Account" }).click()
    await expect(page.getByRole("heading", { name: "Latest activity" })).toBeVisible({ timeout: 20000 })

    await page.goto("/account")
    await expect(page.getByLabel("Display name")).toHaveValue(`You ${stamp}`, { timeout: 20000 })
    await page.getByLabel("Display name").fill(`Renamed ${stamp}`)
    await page.getByLabel("Display name").press("Tab")
    await expect(page.getByLabel("Display name")).toHaveValue(`Renamed ${stamp}`)

    await page.locator('nav[aria-label="Primary"]').getByRole("button", { name: "Add", exact: true }).click()
    await page.getByLabel("Restaurant name").fill(placeName)
    await page.getByLabel("Cuisine").fill("Diner")
    await page.getByLabel("Location").fill("Luxembourg City")
    await page.getByRole("button", { name: "Add Restaurant", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Add Restaurant" })).toBeHidden({ timeout: 30000 })

    await page.goto("/")
    const placeLink = page.getByRole("link", { name: placeName })
    await expect(placeLink).toBeVisible({ timeout: 20000 })
    await placeLink.click()
    await page.getByRole("button", { name: "Want to try?", exact: true }).click()
    await expect(page.getByRole("button", { name: "Want to try 1", exact: true })).toBeVisible({ timeout: 20000 })

    await page.goto("/you")
    await expect(page.getByText("Saved · 1")).toBeVisible({ timeout: 20000 })
    await expect(page.getByText("Want to try · 1")).toBeVisible()
    await expect(page.getByText(placeName).first()).toBeVisible()

    expect(errors).toEqual([])
})
