import type { Page } from "@playwright/test"

const TEST_PREFIX = "e2e-"

export function testEmail(label: string): string {
    const ts = Date.now()
    return `${TEST_PREFIX}${label}-${ts}@example.com`
}

export function testPassword(): string {
    return "test-password-12345"
}

export async function waitForAppLoad(page: Page): Promise<void> {
    await page.waitForSelector('[data-slot="top-bar"]', { timeout: 15000 })
}

export async function signUp(page: Page, email: string, password: string, name: string): Promise<void> {
    await page.goto("/signup")
    await page.getByRole("button", { name: "Create Account" }).waitFor({ timeout: 15000 })
    await page.getByLabel("Name").fill(name)
    await page.getByLabel("Email").fill(email)
    const passwords = page.getByLabel("Password")
    await passwords.first().fill(password)
    await page.getByLabel("Confirm password").fill(password)
    await page.getByRole("button", { name: "Create Account" }).click()
    await page.waitForURL("/", { timeout: 15000 })
    await waitForAppLoad(page)
}

export async function signIn(page: Page, email: string, password: string): Promise<void> {
    await page.goto("/login")
    await page.getByRole("button", { name: "Sign In" }).waitFor({ timeout: 15000 })
    await page.getByLabel("Email").fill(email)
    await page.getByLabel("Password").fill(password)
    await page.getByRole("button", { name: "Sign In" }).click()
    await page.waitForURL("/", { timeout: 15000 })
    await waitForAppLoad(page)
}

export async function signOut(page: Page): Promise<void> {
    await page.goto("/")
    await waitForAppLoad(page)
    await page.getByLabel("Open account menu").click()
    await page.getByText("Sign Out").click()
    await assertUnauthenticated(page)
}

export function assertAuthenticated(page: Page) {
    return page.getByLabel("Open account menu").waitFor({ state: "visible", timeout: 10000 })
}

export function assertUnauthenticated(page: Page) {
    return page.getByText("Sign In").first().waitFor({ state: "visible", timeout: 10000 })
}

export async function fillLocationField(page: Page, location: string): Promise<void> {
    const fallbackInput = page.locator("[data-fallback-location]")
    if ((await fallbackInput.count()) > 0) {
        await fallbackInput.first().fill(location)
        return
    }

    const autocomplete = page.locator("gmp-place-autocomplete")
    if ((await autocomplete.count()) > 0) {
        const input = autocomplete.locator("input").first()
        if ((await input.count()) > 0) {
            await input.fill(location)
            return
        }
        await autocomplete.first().click()
        await page.keyboard.type(location)
        return
    }

    const divInput = page.locator('[class*="space-y-1.5"]').filter({ hasText: "Location" }).locator("input").first()
    if ((await divInput.count()) > 0) {
        await divInput.fill(location)
        return
    }

    await page.getByLabel("Cuisine").click()
    await page.keyboard.press("Tab")
    await page.waitForTimeout(300)
    await page.keyboard.type(location)
}

export async function addRestaurant(
    page: Page,
    data: {
        name: string
        cuisine: string
        location: string
        notes?: string
    },
): Promise<void> {
    await page.goto("/")
    await waitForAppLoad(page)

    await page.getByRole("button", { name: "Add Restaurant" }).click()

    await page.getByLabel("Restaurant name").fill(data.name)
    await page.getByLabel("Cuisine").fill(data.cuisine)
    await fillLocationField(page, data.location)

    if (data.notes) {
        await page.getByLabel("Notes").fill(data.notes)
    }

    await waitForFriendOptions(page)
    await page.getByLabel("Added by").selectOption({ index: 1 })

    await page.getByRole("button", { name: "Add Restaurant" }).last().click()

    await page.waitForTimeout(2000)
}

export async function waitForFriendOptions(page: Page): Promise<void> {
    const select = page.getByLabel("Added by")
    const start = Date.now()
    while (Date.now() - start < 15000) {
        const count = await select.locator("option").count()
        if (count > 1) return
        await page.waitForTimeout(500)
    }
    throw new Error("Friend options did not load")
}
