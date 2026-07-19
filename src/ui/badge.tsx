import { cva, cx, type VariantProps } from "@ui/variants"
import type { ComponentProps } from "react"

const badge = cva({
    base: "inline-flex items-center rounded-full text-xs font-medium",
    variants: {
        variant: {
            primary: "bg-flame-pea-50 px-2 py-1 text-flame-pea-700 inset-ring inset-ring-flame-pea-700/10",
            gray: "bg-neutral-50 px-2 py-1 text-neutral-600 inset-ring inset-ring-neutral-500/10",
            pink: "bg-pink-50 px-2 py-1 text-pink-700 inset-ring inset-ring-pink-700/10",
            editorial: "bg-flame-pea-600 px-3 py-1.5 font-semibold tracking-wide text-white",
        },
    },
    defaultVariants: {
        variant: "primary",
    },
})

type BadgeProps = ComponentProps<"span"> &
    VariantProps<typeof badge> & {
        as?: keyof HTMLElementTagNameMap
    }

export function Badge({ variant, as: As = "span", className, ...rest }: BadgeProps) {
    return (
        <As data-component="badge" {...rest} className={cx(badge({ variant }), className)} />
    )
}
