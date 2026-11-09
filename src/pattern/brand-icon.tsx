import { cx, type VariantProps } from "@ui/cva.config"

import { brandIcon } from "./brand-icon.variants"

type BrandIconProps = VariantProps<typeof brandIcon> & {
    readonly children: React.ReactNode
    readonly className?: string | undefined
}

export function BrandIcon({ children, size, className }: Readonly<BrandIconProps>) {
    return (
        <div data-slot="brand-icon" className={cx(brandIcon({ size }), className)}>
            {children}
        </div>
    )
}
