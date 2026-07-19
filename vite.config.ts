import { defineConfig } from "vite"
import babel from "@rolldown/plugin-babel"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import path from "path"

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
    resolve: {
        alias: {
            "lucide-react/icons": path.resolve(__dirname, "./node_modules/lucide-react/dist/esm/icons"),
            "@ui": path.resolve(__dirname, "./src/ui"),
            "@core": path.resolve(__dirname, "./src/core"),
            "@features": path.resolve(__dirname, "./src/features"),
            "@routes": path.resolve(__dirname, "./src/routes"),
            "@convex": path.resolve(__dirname, "./convex"),
        },
    },
    build: {
        license: { fileName: "license.md" },
    },
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
        }),
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
        tailwindcss(),
    ],
})
