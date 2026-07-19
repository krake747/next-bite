import { HeadContent, Outlet, createRootRoute } from "@tanstack/react-router"
import { APIProvider } from "@vis.gl/react-google-maps"
import { Suspense } from "react"

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
