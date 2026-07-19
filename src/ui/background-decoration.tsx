import type { ReactNode } from "react"

export function BackgroundDecoration({ children }: { children?: ReactNode }) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#faf9f7] dark:bg-[#1a1918]">
            <BackgroundLayers />
            {children}
        </div>
    )
}

export function BackgroundLayers() {
    return (
        <>
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-0 h-full w-1/2 bg-linear-to-br from-flame-pea-100/40 via-transparent to-transparent dark:from-flame-pea-900/20" />
                <div className="absolute right-0 bottom-0 h-full w-1/2 bg-linear-to-tl from-orange-100/30 via-transparent to-transparent dark:from-orange-900/10" />
            </div>

            <div className="animate-float pointer-events-none absolute top-[20%] left-[10%] h-32 w-32 rounded-full bg-flame-pea-300/15 blur-[80px] will-change-transform" />
            <div
                className="animate-float pointer-events-none absolute right-[15%] bottom-[10%] h-24 w-24 rounded-full bg-orange-300/10 blur-[60px] will-change-transform"
                style={{ animationDelay: "1s" }}
            />
        </>
    )
}
