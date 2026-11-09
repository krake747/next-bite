import { cva } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export const trigger = cva({
    base: "hit-area-2 inline-flex cursor-pointer items-center justify-center transition-colors duration-150",
    composes: [focusRing],
    variants: {
        tone: {
            plain: "rounded-control",
            tinted: "rounded-full bg-tomato-100 text-tomato-600 hover:bg-tomato-200",
            card: "w-full justify-start gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface-muted",
            avatar: "rounded-full hover:bg-surface-muted",
        },
    },
    defaultVariants: {
        tone: "plain",
    },
})
