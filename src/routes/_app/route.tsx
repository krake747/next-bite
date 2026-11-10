import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { type RouterAuth } from "@api/auth.identity"
import { hasCachedSession } from "@api/auth.store"

import { PageLayout } from "../-layouts/page-layout"
import { AppShell } from "./-layout/shell"

export const Route = createFileRoute("/_app")({
    beforeLoad: ({ context, location }) => {
        if (location.pathname.startsWith("/invite/")) {
            return
        }
        if (mustSignIn(context.auth)) {
            // oxlint-disable-next-line typescript/only-throw-error -- TanStack Router redirects via thrown redirect objects by design
            throw redirect({ to: "/login", search: { redirect: location.pathname } })
        }
    },
    component: AuthenticatedLayout,
})

function mustSignIn(auth: RouterAuth | null): boolean {
    if (auth !== null) {
        return !auth.isAuthenticated
    }
    return typeof window !== "undefined" && !hasCachedSession()
}

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
