import { createFileRoute, Outlet } from "@tanstack/react-router"

import { redirectSignedOut } from "@routes/-components/auth-redirects"
import { PublicLayout } from "@routes/-layouts/public-layout"

import { AppShell } from "./-layout/shell"

export const Route = createFileRoute("/_app")({
    beforeLoad: ({ context, location }) => {
        const invitePreview = location.pathname.startsWith("/invite/") && context.auth?.isAuthenticated !== true
        if (!invitePreview) {
            redirectSignedOut(context.auth, location.pathname)
        }
        return { chrome: invitePreview ? ("public" as const) : ("app" as const) }
    },
    component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
    const chrome = Route.useRouteContext({ select: (context) => context.chrome })
    if (chrome === "public") {
        return (
            <PublicLayout>
                <Outlet />
            </PublicLayout>
        )
    }
    return (
        <div data-slot="page-layout" className="flex min-h-screen flex-col">
            <AppShell>
                <Outlet />
            </AppShell>
        </div>
    )
}
