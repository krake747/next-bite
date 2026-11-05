import CircleAlert from "lucide-react/icons/circle-alert"

import { cx } from "@ui/variants"

export function ErrorBanner({
    className,
    children,
    ...props
}: Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }>) {
    return (
        <div
            data-slot="error-banner"
            role="alert"
            className={cx(
                "mb-4 flex items-center gap-2 rounded-control border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive",
                className,
            )}
            {...props}
        >
            <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
            <span>{children}</span>
        </div>
    )
}
