import { Suspense } from "solid-js"
import { HeadContent, Outlet, createRootRoute } from "@tanstack/solid-router"
import { APIProvider } from "solid-google-maps"
import { AuthProvider } from "../core/auth-provider"
import { Loading } from "../ui/loading"

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <>
            <HeadContent />
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places", "marker"]}>
                <AuthProvider>
                    <Suspense fallback={<Loading />}>
                        <Outlet />
                    </Suspense>
                </AuthProvider>
            </APIProvider>
        </>
    )
}
