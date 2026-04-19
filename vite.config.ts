import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import path from "path"

export default defineConfig({
    resolve: {
        alias: {
            "@ui": path.resolve(__dirname, "./src/ui"),
            "@core": path.resolve(__dirname, "./src/core"),
            "@features": path.resolve(__dirname, "./src/features"),
            "@routes": path.resolve(__dirname, "./src/routes"),
        },
        // tsconfigPaths: true,
    },
    build: {
        license: { fileName: "license.md" },
    },
    plugins: [
        tanstackRouter({
            target: "solid",
            autoCodeSplitting: true,
        }),
        tailwindcss(),
        solid(),
    ],
})
