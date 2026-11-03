import { defineConfig, type VariantProps } from "cva"
import { twMerge } from "tailwind-merge"

const { cva, cx } = defineConfig({
    hooks: {
        onComplete: (className) => twMerge(className),
    },
})

export { cva, cx, type VariantProps }
