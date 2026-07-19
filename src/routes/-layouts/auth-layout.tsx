import { Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"
import type { ReactNode } from "react"

import { BackgroundLayers } from "@ui/background-decoration"
import { BrandIcon } from "@ui/brand-icon"

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
            <BackgroundLayers />
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
                                <BrandIcon>{icon}</BrandIcon>
                                <div className="absolute top-0 -right-2 size-3 rounded-full bg-yellow-400" />
                            </div>
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
    )
}
