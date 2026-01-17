import { defineConfig, type ClassValue, type VariantProps } from "cva"
import { twMerge } from "tailwind-merge"

const { cva, cx, compose } = defineConfig({
    hooks: {
        onComplete: (className) => twMerge(className),
    },
})

export { compose, cva, cx, type ClassValue, type VariantProps }
