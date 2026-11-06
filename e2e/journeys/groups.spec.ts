import { expect, test } from "@playwright/test"

// Authenticated group journey against a dev server (password auth needs the trusted
// localhost:5173 origin, which the Worker preview does not have). Creates throwaway
// users, groups, and restaurants in the local dev deployment only.
test("create group, add restaurant, and view it on the shared list", async ({ page }) => {
    const stamp = Date.now()
    const email = `e2e-${stamp}@example.com`
    const groupName = `E2E Crew ${stamp}`
    const placeName = `E2E Diner ${stamp}`
    const errors: unknown[] = []
    page.on("pageerror", (error) => {
        errors.push(error)
    })

    // Never depend on Google in the gate: without the Maps script the location field stays a
    // plain labeled input.
    await page.route("**/maps.googleapis.com/**", (route) => {
        void route.abort()
    })
    await page.goto("/signup")
    await page.getByLabel("Name").fill("E2E")
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password", { exact: true }).fill("E2e-test-123")
    await page.getByLabel("Confirm password").fill("E2e-test-123")
    await page.getByRole("button", { name: "Create Account" }).click()
    await expect(page.getByRole("heading", { name: "Latest activity" })).toBeVisible({
        timeout: 20000,
    })

    await page.goto("/groups")
    await page.getByLabel("New group").fill(groupName)
    await page.getByRole("button", { name: "Create group" }).click()
    await expect(page.getByRole("link", { name: groupName })).toBeVisible({ timeout: 20000 })

    await page.locator('nav[aria-label="Primary"]').getByRole("button", { name: "Add", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Add Restaurant" })).toBeVisible()
    await page.getByLabel("Restaurant name").fill(placeName)
    await page.getByLabel("Cuisine").fill("Diner")
    await page.getByLabel("Location").fill("Luxembourg City")
    await page.getByRole("button", { name: "Add Restaurant", exact: true }).click()
    await expect(page.getByRole("heading", { name: "Add Restaurant" })).toBeHidden({ timeout: 30000 })

    await page.goto("/")
    await expect(page.getByText(placeName).first()).toBeVisible({ timeout: 20000 })

    await page.getByText(placeName).first().click()
    await expect(page.getByRole("button", { name: "Add to group" }).first()).toBeVisible({ timeout: 20000 })
    await page.getByRole("button", { name: "Add to group" }).first().click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: "Add to group" }).click()
    await expect(dialog.getByRole("button", { name: "Remove" })).toBeVisible({ timeout: 20000 })
    await page.keyboard.press("Escape")

    await page.goto("/groups")
    await page.getByRole("link", { name: groupName }).click()
    await expect(page.getByText(placeName)).toBeVisible({ timeout: 20000 })

    expect(errors).toEqual([])
})
