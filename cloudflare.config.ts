import { defineConfig } from "cf/config"

import * as entrypoint from "./src/server.ts" with { type: "cf-worker" }

export default defineConfig({
    worker: {
        name: "next-bite",
        compatibilityDate: "2026-11-03",
        entrypoint,
        assets: {
            notFoundHandling: "single-page-application",
        },
    },
})
