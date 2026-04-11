import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"

export default defineConfig({
    build: {
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: "vendor",
                            test: /node_modules/,
                            entriesAware: true,
                        },
                    ],
                },
            },
        },
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
