import { defineConfig } from "cf/config"

export default defineConfig({
    worker: {
        name: "next-bite",
        compatibilityDate: "2026-11-03",
        observability: {
            enabled: true,
        },
        assets: {
            notFoundHandling: "single-page-application",
        },
    },
})
