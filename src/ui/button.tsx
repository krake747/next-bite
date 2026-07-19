import { Button as BaseButton } from "@base-ui/react/button"
import { cva, type VariantProps } from "@ui/variants"
import type { ComponentProps } from "react"

const button = cva({
    base: "group inline-flex cursor-pointer items-center justify-center font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] dark:shadow-none",
    variants: {
        variant: {
            primary:
                "bg-flame-pea-700 text-white hover:bg-flame-pea-600 focus-visible:outline-flame-pea-700 dark:bg-flame-pea-800 dark:text-white dark:hover:bg-flame-pea-700 dark:focus-visible:outline-flame-pea-50",
            secondary:
                "bg-white text-neutral-900 inset-ring-neutral-300 hover:bg-neutral-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20",
        },
        size: {
            md: "gap-x-1.5 rounded-md px-2.5 py-1.5 text-sm",
            lg: "gap-x-1.5 rounded-md px-3 py-2 text-sm",
        },
    },
    defaultVariants: {
        variant: "primary",
        size: "lg",
    },
})

type ButtonProps = ComponentProps<typeof BaseButton> & VariantProps<typeof button>

export function Button({ variant, size, className, children, ...rest }: ButtonProps) {
    return (
        <BaseButton data-slot="button" {...rest} className={button({ variant, size, class: className })}>
            {children}
        </BaseButton>
    )
}
