import { test } from "@playwright/test"
import {
    testEmail,
    testPassword,
    signUp,
    signIn,
    waitForAppLoad,
    assertAuthenticated,
    assertUnauthenticated,
} from "./utils/test-helpers"

const EMAIL = testEmail("auth")
const PASSWORD = testPassword()
const NAME = "E2E Auth Test"

test("auth flow: sign up, sign out, sign back in", async ({ page }) => {
    test.setTimeout(45000)

    await signUp(page, EMAIL, PASSWORD, NAME)
    await assertAuthenticated(page)

    await page.goto("/")
    await waitForAppLoad(page)
    await page.getByLabel("Open account menu").click()
    await page.getByText("Sign Out").click()
    await assertUnauthenticated(page)

    await signIn(page, EMAIL, PASSWORD)
    await assertAuthenticated(page)
})
