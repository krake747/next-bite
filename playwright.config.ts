import { defineConfig } from "@playwright/test"

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: true,
    retries: 0,
    reporter: "list",
    use: {
        baseURL: process.env["E2E_BASE_URL"] ?? "http://localhost:5193",
    },
    projects: [
        {
            name: "mobile",
            use: { viewport: { width: 390, height: 844 } },
        },
        {
            name: "desktop",
            use: { viewport: { width: 1440, height: 900 } },
        },
    ],
    webServer:
        process.env["E2E_NO_SERVER"] === undefined
            ? {
                  command: "pnpm dev --port 5193",
                  url: "http://localhost:5193/",
                  reuseExistingServer: true,
                  timeout: 120000,
              }
            : undefined,
})
