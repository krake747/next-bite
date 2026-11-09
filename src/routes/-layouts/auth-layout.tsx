import { ForkKnifeIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { BackgroundLayers } from "@pattern/background-decoration"
import { BrandIcon } from "@pattern/brand-icon"

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
        <div className="relative flex min-h-screen flex-col bg-background lg:flex-row">
            <div className="relative hidden flex-1 flex-col justify-end overflow-hidden bg-primary p-12 text-inverse lg:flex">
                <BackgroundLayers />
                <div className="relative">
                    <p className="font-display text-5xl leading-tight font-semibold tracking-tight text-balance">
                        Good food.
                        <br />
                        Great company.
                    </p>
                    <p className="mt-4 max-w-md text-lg text-inverse/80">
                        Your friends have good taste. Save spots together, vote want-to-go, and pick the next table in
                        minutes.
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-6 inline-flex">
                            <BrandIcon>{icon}</BrandIcon>
                        </div>
                    </div>
                    {title}
                    <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
                </div>

                <div className="relative mt-8 w-full max-w-md rounded-card border border-border bg-surface/80 p-6 shadow-card backdrop-blur-sm">
                    {children}
                </div>

                <div className="mt-6 w-full max-w-md text-center">{footerLink}</div>

                <div className="mt-4 text-center">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ForkKnifeIcon className="size-4" />
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}
