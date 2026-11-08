import { createFileRoute, Outlet } from "@tanstack/react-router"

import { PageLayout } from "../-layouts/page-layout"
import { AppShell } from "./-layout/shell"

export const Route = createFileRoute("/_app")({
    component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
    // Pathless entry for signed-in areas: provides the app chrome while each
    // page keeps its own session gate, so signed-out deep links and SSR output
    // behave exactly as before.
    return (
        <PageLayout>
            <AppShell>
                <Outlet />
            </AppShell>
        </PageLayout>
    )
}
