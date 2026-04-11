import { Suspense } from "solid-js"
import { HeadContent, Outlet, createRootRoute } from "@tanstack/solid-router"
import { AuthProvider } from "../core/auth-provider"
import { Loading } from "../ui/loading"

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <>
            <HeadContent />
            <AuthProvider>
                <Suspense fallback={<Loading />}>
                    <Outlet />
                </Suspense>
            </AuthProvider>
        </>
    )
}
