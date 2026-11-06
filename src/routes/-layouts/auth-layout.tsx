import { Link } from "@tanstack/react-router"
import UtensilsCrossed from "lucide-react/icons/utensils-crossed"

import { BackgroundLayers } from "@ui/background-decoration"
import { BrandIcon } from "@ui/brand-icon"

export function AuthLayout({
    icon,
    title,
    subtitle,
    children,
    footerLink,
}: Readonly<{
    icon: React.ReactNode
    title: React.ReactNode
    subtitle: string
    children: React.ReactNode
    footerLink: React.ReactNode
}>) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
            <BackgroundLayers />
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)`,
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-6 inline-flex">
                            <div className="relative">
                                <BrandIcon>{icon}</BrandIcon>
                                <div className="absolute top-0 -right-2 size-3 rounded-full bg-mango-500" />
                            </div>
                        </div>
                    </div>
                    {title}
                    <p className="mt-4 text-lg text-stone-600">{subtitle}</p>
                </div>

                <div className="relative mt-8 w-full max-w-md rounded-card border border-stone-200/60 bg-surface/80 p-6 shadow-card backdrop-blur-sm">
                    {children}
                </div>

                <div className="mt-6 w-full max-w-md text-center">{footerLink}</div>

                <div className="mt-4 text-center">
                    <Link
                        to="/"
                        viewTransition
                        className="group inline-flex items-center gap-2 text-sm text-stone-600 transition-colors hover:text-stone-900"
                    >
                        <UtensilsCrossed className="size-4 transition-transform group-hover:-rotate-12" />
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}
