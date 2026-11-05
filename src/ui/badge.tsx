import { cva, cx, type VariantProps } from "@ui/cva.config"

export const badge = cva({
    base: "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
    variants: {
        variant: {
            neutral: "bg-stone-100 text-stone-700 inset-ring inset-ring-stone-900/10",
            brand: "bg-tomato-100 text-tomato-700 inset-ring inset-ring-tomato-700/10",
            success: "bg-basil-100 text-basil-600 inset-ring inset-ring-basil-600/10",
            accent: "bg-plum/10 text-plum inset-ring inset-ring-plum/20",
            outline: "border border-border bg-transparent text-stone-600",
        },
    },
    defaultVariants: {
        variant: "neutral",
    },
})

type BadgeProps = VariantProps<typeof badge> & {
    readonly className?: string
    readonly children?: React.ReactNode
}

export function Badge({ variant, className, children }: Readonly<BadgeProps>) {
    return (
        <span data-slot="badge" className={cx(badge({ variant }), className)}>
            {children}
        </span>
    )
}
