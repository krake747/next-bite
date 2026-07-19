import type { ComponentProps } from "react"

import { cx } from "@ui/variants"

export function ErrorBanner({ className, children, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-slot="error-banner"
            className={cx(
                "mb-4 rounded-lg bg-red-50/80 p-3 text-sm text-red-600 backdrop-blur-sm dark:bg-red-900/20 dark:text-red-400",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}
