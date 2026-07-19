import path from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test-setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
    },
    resolve: {
        alias: {
            "@ui": path.resolve(__dirname, "./src/ui"),
            "@core": path.resolve(__dirname, "./src/core"),
            "@pattern": path.resolve(__dirname, "./src/pattern"),
            "@features": path.resolve(__dirname, "./src/features"),
            "@routes": path.resolve(__dirname, "./src/routes"),
        },
    },
})
