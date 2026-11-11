import { expect, test } from "@playwright/test"

test("paints the public landing heading", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("heading", { name: "Your friends have good taste" })).toBeVisible()
})
