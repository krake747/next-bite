import { cva, type VariantProps } from "@ui/cva.config"

const brandIcon = cva({
    base: "relative flex items-center justify-center rounded-card bg-linear-to-br from-tomato-500 to-tomato-600 text-white shadow-popover",
    variants: {
        size: {
            sm: "size-12",
            md: "size-16",
            lg: "size-20",
        },
    },
    defaultVariants: {
        size: "md",
    },
})

type BrandIconProps = VariantProps<typeof brandIcon> & {
    readonly children: React.ReactNode
}

export function BrandIcon({ children, size }: Readonly<BrandIconProps>) {
    return (
        <div className="relative">
            <div className="absolute inset-0 rounded-full bg-tomato-500/20 blur-2xl" />
            <div className="absolute inset-0 animate-pulse rounded-full bg-tomato-400/10 blur-xl" />
            <div className={brandIcon({ size })}>{children}</div>
        </div>
    )
}
