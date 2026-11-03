import { HeadContent, Outlet, createRootRoute } from "@tanstack/react-router"
import { APIProvider } from "@vis.gl/react-google-maps"
import { Suspense } from "react"

import { AuthProvider } from "@core/auth-provider"
import { env } from "@core/env"
import { LoadingPlaceholder } from "@ui/loading"
import { ThemeProvider } from "@ui/theme-context"

export const Route = createRootRoute({
    component: RootComponent,
})

function RootComponent() {
    return (
        <>
            <HeadContent />
            <APIProvider apiKey={env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places", "marker"]}>
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
