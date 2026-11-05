import { cn as merge } from "cn"
import { defineConfig } from "cva/config"

export const { cva, cx } = defineConfig({ cx: merge })

export type { ClassValue, VariantProps } from "cva"
