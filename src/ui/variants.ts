import { cva } from "@ui/cva.config"

export const focusRing = cva({
    base: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
})

export const control = cva({
    base: "w-full rounded-control border border-border bg-surface px-3 py-2.5 text-base text-foreground transition-colors duration-150 placeholder:text-muted-foreground hover:border-border-strong focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground",
})

export const fieldLabel = cva({
    base: "block text-sm font-medium text-foreground",
})
