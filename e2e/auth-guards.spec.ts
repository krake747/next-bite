import { test, expect } from "@playwright/test"

import { waitForAppLoad } from "./utils/test-helpers"

test.describe("Auth guards", () => {
    test("unauthenticated home page shows Sign In button", async ({ page }) => {
        await page.goto("/")
        await waitForAppLoad(page)

        await expect(page.getByText("Sign In").first()).toBeVisible()
    })

    test("unauthenticated home page shows Sign in to add", async ({ page }) => {
        await page.goto("/")
        await waitForAppLoad(page)

        await expect(page.getByRole("button", { name: "Sign in to add" })).toBeVisible()
    })

    test("unauthenticated home page has no Add Restaurant button", async ({ page }) => {
        await page.goto("/")
        await waitForAppLoad(page)

        await expect(page.getByRole("button", { name: "Add Restaurant" })).toHaveCount(0)
    })

    test("unauthenticated visitor can browse home page", async ({ page }) => {
        await page.goto("/")
        await waitForAppLoad(page)

        await expect(page.getByText("Our next bite")).toBeVisible()
        await expect(page.getByRole("button", { name: "Spin the wheel" })).toBeVisible()
    })

    test("Sign in to add navigates to login page", async ({ page }) => {
        await page.goto("/")
        await waitForAppLoad(page)

        await page.getByRole("button", { name: "Sign in to add" }).click()

        await expect(page).toHaveURL(/\/login/)
        await expect(page.getByText("Welcome back")).toBeVisible()
    })
})
