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
            testMatch: ["public-ssr.spec.ts", "navigation.spec.ts", "restaurant-boundary.spec.ts"],
            use: { viewport: { width: 390, height: 844 } },
        },
        {
            name: "desktop",
            testMatch: ["public-ssr.spec.ts", "navigation.spec.ts", "restaurant-boundary.spec.ts"],
            use: { viewport: { width: 1440, height: 900 } },
        },
        {
            name: "journey",
            testMatch: ["journeys/*.spec.ts"],
            use: { baseURL: "http://localhost:5173", viewport: { width: 1440, height: 900 } },
        },
        {
            name: "journey-mobile",
            testMatch: ["journeys/*.spec.ts"],
            use: { baseURL: "http://localhost:5173", viewport: { width: 390, height: 844 } },
        },
    ],
    webServer:
        process.env["E2E_NO_SERVER"] === undefined
            ? [
                  {
                      // Build the production Worker bundle, then serve it locally. The gate proves
                      // the built SSR boundary (single React, clean hydration). Point E2E_BASE_URL
                      // at a dev server with E2E_NO_SERVER=1 set when iterating quickly.
                      command: "pnpm build && wrangler dev --config e2e/worker.preview.toml --port 5193",
                      url: "http://localhost:5193/",
                      reuseExistingServer: false,
                      timeout: 300000,
                  },
                  {
                      // Password-auth journeys need the trusted localhost:5173 origin, which the
                      // Worker preview does not have. Throwaway users and data land in the local
                      // dev deployment only, never preview or production.
                      command: "pnpm dev --port 5173",
                      url: "http://localhost:5173/",
                      reuseExistingServer: false,
                      timeout: 120000,
                  },
              ]
            : undefined,
})
