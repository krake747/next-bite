import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { hasCachedSession } from "@api/auth.store"

import { PageLayout } from "../-layouts/page-layout"
import { AppShell } from "./-layout/shell"

export const Route = createFileRoute("/_app")({
    beforeLoad: ({ location }) => {
        // UX-only redirect: the server has no session (localStorage is
        // client-only), so SSR keeps painting chrome plus the per-page
        // SessionGate fallback. On the client a missing cached session means
        // no remembered login, so shortcut signed-out deep links to login
        // with a return path. Convex remains the auth authority; the gates
        // below stay as the correctness backstop. Invites keep their preview
        // UI instead of bouncing.
        if (typeof window === "undefined") {
            return
        }
        if (location.pathname.startsWith("/invite/")) {
            return
        }
        if (!hasCachedSession()) {
            // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router redirects via thrown redirect objects by design
            throw redirect({ to: "/login", search: { redirect: location.pathname } })
        }
    },
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
