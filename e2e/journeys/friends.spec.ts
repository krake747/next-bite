import { expect, test, type Browser, type Page, type ViewportSize } from "@playwright/test"

async function blockMaps(page: Page): Promise<void> {
    await page.route("**/maps.googleapis.com/**", (route) => {
        void route.abort()
    })
}

async function signUp(page: Page, name: string, email: string): Promise<void> {
    await page.goto("/signup")
    await page.getByLabel("Name").fill(name)
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password", { exact: true }).fill("E2e-test-123")
    await page.getByLabel("Confirm password").fill("E2e-test-123")
    await page.getByRole("button", { name: "Create Account" }).click()
    await expect(page.getByRole("heading", { name: "Latest activity" })).toBeVisible({ timeout: 20000 })
}

async function newUserPage(
    browser: Browser,
    viewport: ViewportSize | null,
    name: string,
    email: string,
): Promise<Page> {
    const context = await browser.newContext({ viewport: viewport ?? { width: 1440, height: 900 } })
    const page = await context.newPage()
    await blockMaps(page)
    await signUp(page, name, email)
    return page
}

// Two-account friendship journey against a dev server (password auth needs the trusted
// localhost:5173 origin). Throwaway users and data land in the local dev deployment only.
test("friend request, accept, share, and shared discovery", async ({ browser, viewport }) => {
    const stamp = Date.now()
    const annaName = `Anna ${stamp}`
    const benName = `Ben ${stamp}`
    const annaEmail = `e2e-anna-${stamp}@example.com`
    const benEmail = `e2e-ben-${stamp}@example.com`
    const placeName = `E2E Bistro ${stamp}`
    const aErrors: unknown[] = []
    const bErrors: unknown[] = []

    const anna = await newUserPage(browser, viewport, annaName, annaEmail)
    anna.on("pageerror", (error) => {
        aErrors.push(error)
    })
    const ben = await newUserPage(browser, viewport, benName, benEmail)
    ben.on("pageerror", (error) => {
        bErrors.push(error)
    })

    await anna.goto("/friends")
    await anna.getByLabel("Invite by email").fill(benEmail)
    await anna.getByRole("button", { name: "Send request" }).click()
    await expect(anna.getByText("Request sent.")).toBeVisible({ timeout: 20000 })

    await ben.goto("/friends")
    await expect(ben.getByText("Wants to be friends")).toBeVisible({ timeout: 20000 })
    await ben.getByRole("button", { name: "Accept" }).click()
    await expect(ben.getByText(annaName)).toBeVisible({ timeout: 20000 })

    await anna.locator('nav[aria-label="Primary"]').getByRole("button", { name: "Add", exact: true }).click()
    await anna.getByLabel("Restaurant name").fill(placeName)
    await anna.getByLabel("Cuisine").fill("French")
    await anna.getByLabel("Location").fill("Luxembourg City")
    await anna.getByRole("button", { name: "Add Restaurant", exact: true }).click()
    await expect(anna.getByRole("heading", { name: "Add Restaurant" })).toBeHidden({ timeout: 30000 })

    await anna.goto("/")
    await expect(anna.getByText(placeName).first()).toBeVisible({ timeout: 20000 })
    await anna.getByText(placeName).first().click()
    await expect(anna.getByRole("button", { name: "Share" })).toBeVisible({ timeout: 20000 })
    await anna.getByRole("button", { name: "Share" }).click()
    const dialog = anna.getByRole("dialog")
    await dialog.getByRole("button", { name: "Share" }).click()
    await expect(dialog.getByRole("button", { name: "Remove" })).toBeVisible({ timeout: 20000 })
    await anna.keyboard.press("Escape")

    await ben.goto("/friends")
    await expect(ben.getByText(placeName)).toBeVisible({ timeout: 20000 })

    expect(aErrors).toEqual([])
    expect(bErrors).toEqual([])
})
