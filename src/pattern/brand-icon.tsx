import { cx, type VariantProps } from "@ui/cva.config"

import { brandIcon } from "./brand-icon.variants"

type BrandIconProps = VariantProps<typeof brandIcon> & React.ComponentProps<"div">

export function BrandIcon({ children, size, className, ...props }: Readonly<BrandIconProps>) {
    return (
        <div data-slot="brand-icon" className={cx(brandIcon({ size }), className)} {...props}>
            {children}
        </div>
    )
}
