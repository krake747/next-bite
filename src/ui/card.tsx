import { cx } from "@ui/cva.config"

export function Card({ className, children, ...props }: Readonly<React.ComponentProps<"div">>) {
    return (
        <div
            data-slot="card"
            className={cx(
                "group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface",
                "shadow-card transition-shadow duration-150",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}
