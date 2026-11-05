import { cx } from "@ui/variants"

export function Skeleton({ className, ...props }: Readonly<{ className?: string | undefined }>) {
    return <div className={cx("animate-pulse rounded-lg bg-stone-200", className)} {...props} />
}
