import { test, expect } from "@playwright/test"

import { testEmail, testPassword, signUp, waitForAppLoad } from "./utils/test-helpers"

test("empty restaurant list shows no-matches prompt when searching", async ({ page }) => {
    const email = testEmail("empty-rest")
    await signUp(page, email, testPassword(), "E2E Empty State")

    await page.goto("/")
    await waitForAppLoad(page)

    const searchInput = page.getByPlaceholder("Search restaurants...")
    await searchInput.fill("zzz_nonexistent_restaurant_name_12345")

    await expect(page.getByText("No matches found")).toBeVisible({
        timeout: 5000,
    })
})

test("wheel page loads and back-nav is present", async ({ page }) => {
    const email = testEmail("wh-load")
    await signUp(page, email, testPassword(), "E2E Wheel Load")

    await page.goto("/wheel")
    await waitForAppLoad(page)

    await expect(page.getByText("Spin the wheel")).toBeVisible()
    await expect(page.getByText("Press the button to give the wheel a whirl")).toBeVisible()
})
