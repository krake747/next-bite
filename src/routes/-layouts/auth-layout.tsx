import { Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"
import type { ReactNode } from "react"

export function AuthLayout({
    icon,
    title,
    subtitle,
    children,
    footerLink,
}: {
    icon: ReactNode
    title: ReactNode
    subtitle: string
    children: ReactNode
    footerLink: ReactNode
}) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#faf9f7] dark:bg-[#1a1918]">
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

            <div
                className="pointer-events-none absolute inset-0 opacity-[0.015] dark:opacity-[0.02]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-6 inline-flex">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-flame-pea-500/20 blur-2xl" />
                                <div className="absolute inset-0 animate-pulse rounded-full bg-flame-pea-400/10 blur-xl" />
                                <div className="relative flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-flame-pea-500 to-flame-pea-600 text-white shadow-[0_8px_30px_rgb(181,57,32,0.3)] dark:from-flame-pea-600 dark:to-flame-pea-700 dark:shadow-[0_8px_30px_rgb(181,57,32,0.4)]">
                                    {icon}
                                </div>
                                <div className="absolute top-0 -right-2 size-3 rounded-full bg-yellow-400" />
                            </div>
                        </div>
                        {title}
                        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">{subtitle}</p>
                    </div>

                    <div className="relative rounded-2xl border border-neutral-200/60 bg-white/80 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.08)] backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-[0_4px_20px_rgb(0,0,0,0.3)]">
                        {children}
                    </div>

                    <div className="mt-6 text-center">{footerLink}</div>

                    <div className="mt-4 text-center">
                        <Link
                            to="/"
                            viewTransition
                            className="group inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                        >
                            <UtensilsCrossed
                                className="size-4 transition-transform group-hover:-rotate-12"
                                aria-hidden="true"
                            />
                            Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
