import { cva } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export const button = cva({
    base: "group inline-flex min-h-11 cursor-pointer items-center justify-center font-semibold transition-colors duration-150 active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground disabled:shadow-none md:min-h-10",
    composes: [focusRing],
    variants: {
        tone: {
            primary: "bg-primary text-inverse shadow-xs hover:bg-primary-hover",
            secondary:
                "bg-surface-muted text-foreground shadow-xs inset-ring inset-ring-border-strong hover:bg-surface-muted",
            outline:
                "border border-border bg-transparent text-muted-foreground hover:bg-surface-muted hover:text-foreground",
            ghost: "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
            destructive: "bg-destructive text-inverse shadow-xs hover:bg-destructive/90",
        },
        size: {
            sm: "gap-x-1 rounded-control px-2.5 py-1 text-xs",
            md: "gap-x-1.5 rounded-control px-3 py-1.5 text-sm",
            lg: "gap-x-1.5 rounded-control px-4 py-2 text-sm",
        },
    },
    defaultVariants: {
        tone: "primary",
        size: "lg",
    },
})
