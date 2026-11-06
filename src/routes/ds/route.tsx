import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router"

import { env } from "@core/env"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

import { designSystemSections, sectionGroups } from "./-sections/registry"

export const Route = createFileRoute("/ds")({
    beforeLoad: () => {
        if (!env.DEV) {
            // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router redirects via thrown redirect objects by design
            throw redirect({ to: "/" })
        }
    },
    component: DesignSystemShell,
})

const navLink = cx(
    focusRing(),
    "block rounded-control px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900",
)
const navLinkActive = "bg-surface-muted text-stone-900"

function DesignSystemNav() {
    return (
        <nav aria-label="Design system" className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] space-y-6 overflow-y-auto pb-6">
                <div>
                    <Link
                        to="/ds"
                        viewTransition
                        className={navLink}
                        activeProps={{ className: navLinkActive }}
                        activeOptions={{ exact: true }}
                    >
                        Overview
                    </Link>
                </div>
                {sectionGroups.map((group) => (
                    <div key={group}>
                        <p className="px-3 pb-1 text-xs font-semibold tracking-widest text-stone-500 uppercase">
                            {group}
                        </p>
                        <ul className="space-y-0.5">
                            {Object.values(designSystemSections)
                                .filter((entry) => entry.meta.group === group)
                                .map((entry) => (
                                    <li key={entry.meta.id}>
                                        <Link
                                            to="/ds/$sectionId"
                                            params={{ sectionId: entry.meta.id }}
                                            viewTransition
                                            className={navLink}
                                            activeProps={{ className: navLinkActive }}
                                        >
                                            {entry.meta.title}
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>
        </nav>
    )
}

function DesignSystemShell() {
    return (
        <PageLayout>
            <PageContainer>
                <div className="flex gap-8">
                    <DesignSystemNav />
                    <div className="min-w-0 flex-1">
                        <Outlet />
                    </div>
                </div>
            </PageContainer>
        </PageLayout>
    )
}
