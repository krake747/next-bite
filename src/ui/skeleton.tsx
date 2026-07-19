import type { ComponentProps } from "react"
import { cx } from "@ui/variants"

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
    return <div {...props} className={cx("animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700", className)} />
}
