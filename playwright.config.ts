import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: [[process.env.CI ? "dot" : "list"]],
    globalSetup: "./e2e/global-setup.ts",
    globalTeardown: "./e2e/global-teardown.ts",
    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: "pnpm dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
    },
})
