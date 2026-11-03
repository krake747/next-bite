import { cn } from "cn"
import { defineConfig, type VariantProps } from "cva/config"

const { cva, cx } = defineConfig({ cx: cn })

export { cva, cx, type VariantProps }
