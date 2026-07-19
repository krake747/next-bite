import { test, expect } from "@playwright/test"

import {
    testEmail,
    testPassword,
    signUp,
    waitForAppLoad,
    waitForFriendOptions,
    fillLocationField,
} from "./utils/test-helpers"

const EMAIL = testEmail("crud")
const PASSWORD = testPassword()
const NAME = "E2E CRUD Test"

const RESTAURANT = {
    name: `Test Bistro ${Date.now()}`,
    cuisine: "Italian",
    location: "123 Test Street, Berlin",
    notes: "Try the carbonara",
    updatedName: `Updated Bistro ${Date.now()}`,
}

test("restaurant CRUD: add, edit, view card", async ({ page }) => {
    test.setTimeout(60000)

    await signUp(page, EMAIL, PASSWORD, NAME)

    await page.goto("/")
    await waitForAppLoad(page)
    await page.getByRole("button", { name: "Add Restaurant" }).click()

    await page.getByLabel("Restaurant name").fill(RESTAURANT.name)
    await page.getByLabel("Cuisine").fill(RESTAURANT.cuisine)
    await fillLocationField(page, RESTAURANT.location)
    await page.getByLabel("Notes").fill(RESTAURANT.notes)
    await waitForFriendOptions(page)
    await page.getByLabel("Added by").selectOption({ index: 1 })

    await page.getByRole("button", { name: "Add Restaurant" }).last().click()

    await expect(page.getByRole("heading", { name: RESTAURANT.name })).toBeVisible({ timeout: 10000 })

    const card = page
        .locator('[data-slot="card"]')
        .filter({ has: page.getByRole("heading", { name: RESTAURANT.name }) })
    await card.getByLabel("Edit restaurant").click()

    await page.getByLabel("Restaurant name").fill(RESTAURANT.updatedName)
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByRole("heading", { name: RESTAURANT.updatedName })).toBeVisible({ timeout: 10000 })

    await expect(page.getByText(RESTAURANT.cuisine).first()).toBeVisible()
})

test("restaurant delete: add then delete with confirmation", async ({ page }) => {
    test.setTimeout(60000)

    const deleteEmail = testEmail("delete")
    await signUp(page, deleteEmail, testPassword(), "E2E Delete Test")

    const deleteName = `Delete Me ${Date.now()}`

    await page.goto("/")
    await waitForAppLoad(page)
    await page.getByRole("button", { name: "Add Restaurant" }).click()

    await page.getByLabel("Restaurant name").fill(deleteName)
    await page.getByLabel("Cuisine").fill("Test")
    await fillLocationField(page, "Delete Street 1, Berlin")
    await waitForFriendOptions(page)
    await page.getByLabel("Added by").selectOption({ index: 1 })

    await page.getByRole("button", { name: "Add Restaurant" }).last().click()

    await expect(page.getByRole("heading", { name: deleteName })).toBeVisible({ timeout: 10000 })

    const card = page.locator('[data-slot="card"]').filter({ has: page.getByRole("heading", { name: deleteName }) })
    await card.getByLabel("Delete restaurant").click()

    await page.getByRole("button", { name: "Delete" }).click()

    await expect(page.getByRole("heading", { name: deleteName })).not.toBeVisible({ timeout: 10000 })
})
