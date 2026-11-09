import { ForkKnifeIcon } from "@phosphor-icons/react"
import { Link } from "@tanstack/react-router"

import { ButtonLink } from "@pattern/button-link"

export function TopBar() {
    return (
        <div
            data-slot="top-bar"
            className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md"
        >
            <div className="mx-auto flex h-14 w-full max-w-350 items-center justify-between px-4 sm:px-6 lg:px-12">
                <Link to="/" className="flex items-center gap-2 text-foreground hover:text-tomato-600">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-tomato-100 text-tomato-600">
                        <ForkKnifeIcon className="size-4" aria-hidden="true" />
                    </div>
                    <span className="font-display text-lg font-semibold">Next Bite</span>
                </Link>

                <div className="flex items-center gap-2">
                    <ButtonLink to="/signup" tone="secondary">
                        Get started
                    </ButtonLink>
                    <ButtonLink to="/login">Sign In</ButtonLink>
                </div>
            </div>
        </div>
    )
}
