import type { ReactNode } from "react"

const iconSizes = {
    sm: "size-14",
    md: "size-16",
    lg: "size-20",
} as const

export function BrandIcon({
    icon,
    size = "md",
    className,
}: {
    icon: ReactNode
    size?: keyof typeof iconSizes
    className?: string
}) {
    return (
        <div className="relative">
            <div className="absolute inset-0 animate-pulse rounded-full bg-flame-pea-500/20 blur-2xl" />
            <div className="absolute inset-0 rounded-full bg-flame-pea-400/10 blur-xl" />
            <div
                className={[
                    "relative flex items-center justify-center rounded-2xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white shadow-[0_8px_30px_rgb(181,57,32,0.3)] dark:from-flame-pea-600 dark:to-flame-pea-700 dark:shadow-[0_8px_30px_rgb(181,57,32,0.4)]",
                    iconSizes[size],
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                {icon}
            </div>
        </div>
    )
}
