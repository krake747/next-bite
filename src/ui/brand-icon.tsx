export function BrandIcon({
    children,
    size = "md",
}: Readonly<{ children: React.ReactNode; size?: "sm" | "md" | "lg" }>) {
    const sizeClasses = size === "sm" ? "size-12" : size === "lg" ? "size-20" : "size-16"

    return (
        <div className="relative">
            <div className="absolute inset-0 rounded-full bg-tomato-500/20 blur-2xl" />
            <div className="absolute inset-0 animate-pulse rounded-full bg-tomato-400/10 blur-xl" />
            <div
                className={`relative flex ${sizeClasses} items-center justify-center rounded-card bg-linear-to-br from-tomato-500 to-tomato-600 text-white shadow-popover`}
            >
                {children}
            </div>
        </div>
    )
}
