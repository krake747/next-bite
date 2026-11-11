import { defineConfig } from "@playwright/test"

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: true,
    retries: 0,
    reporter: "list",
    use: {
        baseURL: process.env["E2E_BASE_URL"] ?? "http://localhost:5193",
        viewport: { width: 1440, height: 900 },
    },
    webServer:
        process.env["E2E_NO_SERVER"] === undefined
            ? {
                  command: "pnpm build && wrangler dev --config e2e/worker.preview.toml --port 5193",
                  url: "http://localhost:5193/",
                  reuseExistingServer: false,
                  timeout: 300000,
              }
            : undefined,
})
