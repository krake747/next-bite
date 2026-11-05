import { cx } from "@ui/variants"

export function Skeleton({ className, ...props }: Readonly<{ className?: string | undefined }>) {
    return <div className={cx("animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700", className)} {...props} />
}
