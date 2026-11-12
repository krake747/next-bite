// SYNC: docs page lives in src/routes/ds/-sections/skeleton.tsx; keep the demo aligned with this file.
import { cx } from "@ui/cva.config"

export function Skeleton({ className, children, ...props }: Readonly<React.ComponentProps<"div">>) {
    return (
        <div
            data-slot="skeleton"
            className={cx("rounded-control bg-surface-muted motion-safe:animate-pulse", className)}
            {...props}
        >
            {children}
        </div>
    )
}
