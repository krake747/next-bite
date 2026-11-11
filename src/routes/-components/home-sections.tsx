import { UsersThreeIcon } from "@phosphor-icons/react"

import { ButtonLink } from "@pattern/button-link"

export function LandingActions() {
    return (
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ButtonLink to="/signup" size="lg">
                Get started
            </ButtonLink>
        </div>
    )
}

export function LandingCloser() {
    return (
        <section aria-label="Get started" className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-12">
            <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                    <UsersThreeIcon className="size-6 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                        <h2 className="font-display text-lg font-semibold text-balance text-foreground">
                            Find your next favourite, together.
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">Save spots with your friends.</p>
                    </div>
                </div>
                <ButtonLink to="/signup" size="lg" className="shrink-0">
                    Get started
                </ButtonLink>
            </div>
        </section>
    )
}
