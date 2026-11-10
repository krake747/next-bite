import { createFileRoute, Outlet } from "@tanstack/react-router"

import { redirectSignedOut } from "@routes/-components/auth-redirects"

import { PageLayout } from "../-layouts/page-layout"
import { AppShell } from "./-layout/shell"

export const Route = createFileRoute("/_app")({
    beforeLoad: ({ context, location }) => {
        if (!location.pathname.startsWith("/invite/")) {
            redirectSignedOut(context.auth, location.pathname)
        }
    },
    component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
    return (
        <PageLayout>
            <AppShell>
                <Outlet />
            </AppShell>
        </PageLayout>
    )
}
