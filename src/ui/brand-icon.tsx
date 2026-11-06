import { cva, type VariantProps } from "@ui/cva.config"

const brandIcon = cva({
    base: "flex items-center justify-center rounded-card bg-primary text-inverse shadow-popover",
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
    return <div className={brandIcon({ size })}>{children}</div>
}
