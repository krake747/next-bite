import { test, expect } from "@playwright/test"
import {
    testEmail,
    testPassword,
    signUp,
    waitForAppLoad,
    getFirstFriendName,
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

    const friendName = await getFirstFriendName(page)

    await page.goto("/")
    await waitForAppLoad(page)
    await page.getByRole("button", { name: "Add Restaurant" }).click()

    await page.getByLabel("Restaurant name").fill(RESTAURANT.name)
    await page.getByLabel("Cuisine").fill(RESTAURANT.cuisine)
    await fillLocationField(page, RESTAURANT.location)
    await page.getByLabel("Notes").fill(RESTAURANT.notes)
    await page.getByLabel("Added by").selectOption(friendName)

    await page.getByRole("button", { name: "Add Restaurant" }).last().click()

    await expect(page.getByRole("heading", { name: RESTAURANT.name })).toBeVisible({ timeout: 10000 })

    const editButton = page.getByLabel("Edit restaurant").first()
    await editButton.click()

    await page.getByLabel("Restaurant name").fill(RESTAURANT.updatedName)
    await page.getByRole("button", { name: "Save Changes" }).click()

    await expect(page.getByRole("heading", { name: RESTAURANT.updatedName })).toBeVisible({ timeout: 10000 })

    await expect(page.getByText(RESTAURANT.cuisine).first()).toBeVisible()
})
