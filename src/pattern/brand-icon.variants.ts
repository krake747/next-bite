import { cva } from "@ui/cva.config"

export const brandIcon = cva({
    base: "flex items-center justify-center rounded-card bg-primary text-inverse shadow-popover",
    variants: {
        size: {
            sm: "size-12",
            md: "size-16",
            lg: "size-20",
        },
    },
    defaultVariants: {
        size: "md",
    },
})
