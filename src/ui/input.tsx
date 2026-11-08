import { Input as BaseInput } from "@base-ui/react/input"

import { cx } from "@ui/cva.config"
import { control } from "@ui/variants"

export function Input({ className, ...props }: React.ComponentProps<typeof BaseInput>) {
    return <BaseInput data-slot="input" className={cx(control(), className)} {...props} />
}
