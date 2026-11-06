import { Button as BaseButton } from "@base-ui/react/button"

import { cva, type VariantProps } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

const iconButton = cva({
    base: "inline-flex cursor-pointer items-center justify-center rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    composes: [focusRing],
    variants: {
        tone: {
            neutral: "bg-surface/90 text-stone-600 shadow-md backdrop-blur-sm hover:bg-surface hover:text-stone-900",
            destructive: "bg-surface/90 text-destructive shadow-md backdrop-blur-sm hover:bg-destructive/10",
            plain: "text-stone-400 hover:bg-stone-100 hover:text-stone-600",
            inverse: "bg-surface/20 text-inverse backdrop-blur-sm hover:bg-surface/30",
        },
        size: {
            xs: "p-2",
            sm: "size-7",
            md: "size-8",
            lg: "p-3",
        },
    },
    defaultVariants: {
        tone: "neutral",
        size: "md",
    },
})

type IconButtonProps = VariantProps<typeof iconButton> &
    Omit<React.ComponentProps<typeof BaseButton>, "aria-label" | "children" | "type"> & {
        readonly label: string
        readonly children: React.ReactNode
    }

export function IconButton({ tone, size, label, title, className, children, ...props }: Readonly<IconButtonProps>) {
    return (
        <BaseButton
            data-slot="icon-button"
            type="button"
            aria-label={label}
            title={title ?? label}
            className={iconButton({ tone, size, class: className })}
            {...props}
        >
            {children}
        </BaseButton>
    )
}
