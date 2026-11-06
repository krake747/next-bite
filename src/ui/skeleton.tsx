import { cx } from "@ui/cva.config"

export function Skeleton({ className, children, ...props }: Readonly<React.ComponentProps<"div">>) {
    return (
        <div data-slot="skeleton" className={cx("animate-pulse rounded-control bg-stone-200", className)} {...props}>
            {children}
        </div>
    )
}
