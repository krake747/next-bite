import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

import { useAuth } from "@core/hooks"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"

export const Route = createFileRoute("/_authenticated")({
    component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
    const auth = useAuth()

    if (auth.isLoading) return null

    if (!auth.isAuthenticated) {
        throw redirect({ to: "/login" })
    }

    return (
        <PageLayout>
            <PageContainer>
                <Outlet />
            </PageContainer>
        </PageLayout>
    )
}
