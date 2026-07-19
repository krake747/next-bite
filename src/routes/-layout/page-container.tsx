import type { ReactNode } from "react"
import { cx } from "@ui/variants"

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            data-slot="page-container"
            className={cx("container mx-auto w-full max-w-350 px-4 pt-4 pb-6 sm:px-6 lg:px-12", className)}
        >
            {children}
        </div>
    )
}
