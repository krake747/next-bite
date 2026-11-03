import { defineConfig } from "cf/config"

export default defineConfig({
    worker: {
        name: "next-bite",
        compatibilityDate: "2026-11-03",
        assets: {
            notFoundHandling: "single-page-application",
        },
    },
})
