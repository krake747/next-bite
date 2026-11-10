import { cx } from "@ui/cva.config"

export function Skeleton({ className, children, ...props }: Readonly<React.ComponentProps<"div">>) {
    return (
        <div
            data-slot="skeleton"
            className={cx("rounded-control bg-stone-200 motion-safe:animate-pulse", className)}
            {...props}
        >
            {children}
        </div>
    )
}
