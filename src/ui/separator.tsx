import { Separator as BaseSeparator } from "@base-ui/react/separator"

import { cx } from "@ui/cva.config"

export function Separator({ className, orientation = "horizontal", ...props }: BaseSeparator.Props) {
    return (
        <BaseSeparator
            data-slot="separator"
            orientation={orientation}
            className={cx(
                "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
                className,
            )}
            {...props}
        />
    )
}
