import { cx } from "@ui/variants"

export function ErrorBanner({
    className,
    children,
    ...props
}: Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }>) {
    return (
        <div
            data-slot="error-banner"
            className={cx("mb-4 rounded-lg bg-red-50/80 p-3 text-sm text-red-600 backdrop-blur-sm", className)}
            {...props}
        >
            {children}
        </div>
    )
}
