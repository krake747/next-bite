import { test, expect } from "@playwright/test"
import {
    testEmail,
    testPassword,
    signUp,
    waitForAppLoad,
    getFirstFriendName,
    fillLocationField,
} from "./utils/test-helpers"

const EMAIL = testEmail("wheel")
const PASSWORD = testPassword()
const NAME = "E2E Wheel Test"

test("spin the wheel with random selection and see winner", async ({ page }) => {
    test.setTimeout(90000)

    await signUp(page, EMAIL, PASSWORD, NAME)

    const friendName = await getFirstFriendName(page)

    for (const baseName of ["Wheel Test Pho", "Wheel Test Sushi", "Wheel Test Ramen"]) {
        await page.goto("/")
        await waitForAppLoad(page)
        await page.getByRole("button", { name: "Add Restaurant" }).click()

        await page.getByLabel("Restaurant name").fill(baseName)
        await page.getByLabel("Cuisine").fill("Asian")
        await fillLocationField(page, "Karl-Marx-Allee 1, Berlin")
        await page.getByLabel("Added by").selectOption(friendName)

        await page.getByRole("button", { name: "Add Restaurant" }).last().click()

        await expect(page.getByRole("heading", { name: baseName }).first()).toBeVisible({ timeout: 10000 })
    }

    await page.goto("/wheel")
    await waitForAppLoad(page)

    await page.getByRole("button", { name: "Random" }).click()

    await expect(page.getByRole("heading", { name: "Winner" }).first()).toBeVisible({ timeout: 20000 })
})
