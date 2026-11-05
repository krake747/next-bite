import { cx } from "@ui/variants"

export function Card({
    className,
    ...props
}: Readonly<
    {
        className?: string | undefined
        style?: React.CSSProperties | undefined
        children?: React.ReactNode | undefined
    } & Omit<React.ComponentProps<"div">, "className" | "style" | "children">
>) {
    return (
        <div
            data-slot="card"
            className={cx(
                "group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface",
                "shadow-card transition-shadow duration-150",
                className,
            )}
            {...props}
        />
    )
}
