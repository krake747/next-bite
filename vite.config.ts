import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

export default defineConfig({
    plugins: [
        tanstackRouter({
            target: "solid",
            autoCodeSplitting: true,
        }),
        tailwindcss(),
        solid(),
    ],
})
