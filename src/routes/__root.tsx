import { Suspense } from "solid-js"
import { HeadContent, Outlet, createRootRoute } from "@tanstack/solid-router"
import { APIProvider } from "solid-google-maps"
import { AuthProvider } from "@core/auth-provider"
import { LoadingPlaceholder } from "@ui/loading"
import { ThemeProvider } from "./-layout/theme-context"

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <>
            <HeadContent />
            <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places", "marker"]}>
                <AuthProvider>
                    <ThemeProvider>
                        <Suspense fallback={<LoadingPlaceholder />}>
                            <Outlet />
                        </Suspense>
                    </ThemeProvider>
                </AuthProvider>
            </APIProvider>
        </>
    )
}
