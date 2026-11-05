import { cx } from "@ui/variants"

type CardStyle = {
    readonly animationDelay?: string | undefined
}

export function Card({
    className,
    ...props
}: Readonly<{ className?: string | undefined; style?: CardStyle | undefined }>) {
    return (
        <div
            data-slot="card"
            className={cx(
                "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface",
                "shadow-card transition-shadow duration-300",
                className,
            )}
            {...props}
        />
    )
}
