import type { ReactNode } from "react"

export function BrandIcon({ children, size = "md" }: { children: ReactNode; size?: "sm" | "md" | "lg" }) {
    const sizeClasses = size === "sm" ? "size-12" : size === "lg" ? "size-20" : "size-16"

    return (
        <div className="relative">
            <div className="absolute inset-0 rounded-full bg-flame-pea-500/20 blur-2xl" />
            <div className="absolute inset-0 animate-pulse rounded-full bg-flame-pea-400/10 blur-xl" />
            <div
                className={`relative flex ${sizeClasses} items-center justify-center rounded-2xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white shadow-[0_8px_30px_rgb(181,57,32,0.3)] dark:from-flame-pea-600 dark:to-flame-pea-700 dark:shadow-[0_8px_30px_rgb(181,57,32,0.4)]`}
            >
                {children}
            </div>
        </div>
    )
}
