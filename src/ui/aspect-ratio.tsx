import { cssVars } from "@ui/css-vars"
import { cx } from "@ui/cva.config"

type AspectRatioProps = Readonly<
    React.ComponentProps<"div"> & {
        readonly ratio: number
    }
>

export function AspectRatio({ ratio, children, className, ...props }: AspectRatioProps) {
    return (
        <div
            data-slot="aspect-ratio"
            style={cssVars({
                "--ratio": ratio,
            })}
            className={cx("relative aspect-(--ratio)", className)}
            {...props}
        >
            {children}
        </div>
    )
}
