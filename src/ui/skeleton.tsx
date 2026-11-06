import { cx } from "@ui/cva.config"

export function Skeleton({ className, ...props }: Readonly<React.ComponentProps<"div">>) {
    return <div className={cx("animate-pulse rounded-control bg-stone-200", className)} {...props} />
}
