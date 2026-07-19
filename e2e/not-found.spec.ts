import { test, expect } from "@playwright/test"

import { waitForAppLoad } from "./utils/test-helpers"

test("404 page displays layout elements", async ({ page }) => {
    await page.goto("/this-page-does-not-exist")
    await waitForAppLoad(page)

    await expect(page.getByText("Page not found")).toBeVisible()
    await expect(page.getByText("Go back home")).toBeVisible()

    await expect(page.locator('[data-slot="top-bar"]')).toBeVisible()
    await expect(page.locator('[data-slot="page-layout"]')).toBeVisible()
    await expect(page.locator('[data-slot="page-container"]')).toBeVisible()
})

test("404 page footer is visible", async ({ page }) => {
    await page.goto("/nonexistent-route")
    await waitForAppLoad(page)

    await expect(page.locator('[data-slot="footer"]')).toBeVisible()
})

test("404 page has go back home link", async ({ page }) => {
    await page.goto("/some-missing-page")
    await waitForAppLoad(page)

    const homeLink = page.getByRole("link", { name: "Go back home" })
    await expect(homeLink).toBeVisible()
    await expect(homeLink).toHaveAttribute("href", "/")
})
