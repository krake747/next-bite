import type { ReactNode } from "react"

export function ErrorBanner({ children }: { children: ReactNode }) {
    return (
        <div className="mb-4 rounded-lg bg-red-50/80 p-3 text-sm text-red-600 backdrop-blur-sm dark:bg-red-900/20 dark:text-red-400">
            {children}
        </div>
    )
}
