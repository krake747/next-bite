import { Button as BaseButton } from "@base-ui/react/button"

import { cva, type VariantProps } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export const button = cva({
    base: "group inline-flex cursor-pointer items-center justify-center font-semibold transition-colors duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground disabled:shadow-none",
    composes: [focusRing],
    variants: {
        tone: {
            primary: "bg-primary text-inverse shadow-xs hover:bg-primary-hover",
            secondary:
                "bg-surface-muted text-stone-900 shadow-xs inset-ring inset-ring-border-strong hover:bg-stone-200",
            outline: "border border-border bg-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
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

type ButtonProps = VariantProps<typeof button> & React.ComponentProps<typeof BaseButton>

export function Button({ tone, size, className, type, disabled, children, ...props }: Readonly<ButtonProps>) {
    return (
        <BaseButton
            data-slot="button"
            type={type ?? "button"}
            className={button({ tone, size, class: className })}
            disabled={disabled}
            {...props}
        >
            {children}
        </BaseButton>
    )
}
