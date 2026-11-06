import { cx } from "@ui/cva.config"

export function EmptyState({
    title,
    body,
    className,
}: Readonly<{
    title: string
    body?: string | undefined
    className?: string | undefined
}>) {
    return (
        <div className={cx("rounded-card border border-border bg-surface p-6 text-center shadow-card", className)}>
            <p className="font-display text-lg font-semibold text-balance text-stone-900">{title}</p>
            {body !== undefined && body !== "" && (
                <p className="mx-auto mt-1 max-w-md text-sm text-pretty text-stone-600">{body}</p>
            )}
        </div>
    )
}
