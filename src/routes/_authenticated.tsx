import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router"

import { useAuth } from "@core/hooks"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"

export const Route = createFileRoute("/_authenticated")({
    component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
    const router = useRouter()
    const auth = useAuth()

    if (auth.isLoading) return null

    if (!auth.isAuthenticated) {
        throw redirect({
            to: "/login",
            search: { redirect: router.state.location.pathname },
        })
    }

    return (
        <PageLayout>
            <PageContainer>
                <Outlet />
            </PageContainer>
        </PageLayout>
    )
}
