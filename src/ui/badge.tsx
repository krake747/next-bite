import { cva, cx, type VariantProps } from "@ui/variants"

const badge = cva({
    base: "inline-flex items-center rounded-full text-xs font-medium",
    variants: {
        variant: {
            primary: "bg-tomato-50 px-2 py-1 text-tomato-700 inset-ring inset-ring-tomato-700/10",
            gray: "bg-stone-50 px-2 py-1 text-stone-600 inset-ring inset-ring-stone-500/10",
            pink: "bg-pink-50 px-2 py-1 text-pink-700 inset-ring inset-ring-pink-700/10",
            editorial: "bg-tomato-600 px-3 py-1.5 font-semibold tracking-wide text-white",
        },
    },
    defaultVariants: {
        variant: "primary",
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
