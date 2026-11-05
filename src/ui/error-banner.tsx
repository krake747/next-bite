import { cx } from "@ui/variants"

export function ErrorBanner({
    className,
    children,
    ...props
}: Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }>) {
    return (
        <div
            data-slot="error-banner"
            className={cx("mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive backdrop-blur-sm", className)}
            {...props}
        >
            {children}
        </div>
    )
}
