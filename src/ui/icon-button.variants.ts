import { cva } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export const iconButton = cva({
    base: "inline-flex cursor-pointer items-center justify-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    composes: [focusRing],
    variants: {
        tone: {
            neutral:
                "bg-surface/90 text-muted-foreground shadow-md backdrop-blur-sm hover:bg-surface hover:text-foreground",
            destructive: "bg-surface/90 text-destructive shadow-md backdrop-blur-sm hover:bg-destructive/10",
            plain: "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
            inverse: "bg-surface/20 text-inverse backdrop-blur-sm hover:bg-surface/30",
        },
        size: {
            xs: "size-8 p-2",
            sm: "size-8",
            md: "size-9",
            lg: "size-11 p-3",
        },
    },
    defaultVariants: {
        tone: "neutral",
        size: "md",
    },
})
