import { cx } from "@ui/cva.config"

export function PageSection({
    label,
    title,
    action,
    padded,
    className,
    children,
}: Readonly<{
    label: string
    title: React.ReactNode
    action?: React.ReactNode | undefined
    padded?: boolean | undefined
    className?: string | undefined
    children?: React.ReactNode | undefined
}>) {
    return (
        <section aria-label={label} data-slot="page-section" className={className}>
            {action === undefined ? (
                <h2
                    className={cx(
                        "font-display text-2xl font-semibold text-balance text-foreground",
                        padded === true && "px-4",
                    )}
                >
                    {title}
                </h2>
            ) : (
                <div className={cx("flex items-baseline justify-between gap-4", padded === true && "px-4")}>
                    <h2 className="font-display text-2xl font-semibold text-balance text-foreground">{title}</h2>
                    {action}
                </div>
            )}
            {children}
        </section>
    )
}
