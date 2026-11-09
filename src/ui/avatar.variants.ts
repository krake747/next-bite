import { cva } from "@ui/cva.config"

export const avatar = cva({
    base: "relative inline-flex shrink-0 items-center justify-center overflow-visible rounded-full",
    variants: {
        size: {
            xs: "size-6",
            sm: "size-8",
            md: "size-10",
            lg: "size-12",
            xl: "size-16",
        },
        ring: {
            none: "",
            surface: "ring-2 ring-surface",
        },
    },
    defaultVariants: {
        size: "sm",
        ring: "none",
    },
})

export const fallbackText = cva({
    base: "font-semibold",
    variants: {
        size: {
            xs: "text-xs",
            sm: "text-xs",
            md: "text-sm",
            lg: "text-base",
            xl: "text-lg",
        },
    },
    defaultVariants: {
        size: "sm",
    },
})
