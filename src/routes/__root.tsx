import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import { APIProvider } from "@vis.gl/react-google-maps"
import { StrictMode, Suspense } from "react"

import { AuthProvider } from "@core/auth-provider"
import { env } from "@core/env"
import { useEnsureProfile } from "@core/hooks"
import { LoadingPlaceholder } from "@ui/loading"

type RouterContext = {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    component: RootComponent,
})

function RootComponent() {
    const { queryClient } = Route.useRouteContext()

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <HeadContent />
            </head>
            <body>
                <StrictMode>
                    <QueryClientProvider client={queryClient}>
                        <APIProvider apiKey={env.VITE_GOOGLE_MAPS_API_KEY} libraries={["places", "marker"]}>
                            <AuthProvider>
                                <EnsureProfile>
                                    <Suspense fallback={<LoadingPlaceholder />}>
                                        <Outlet />
                                    </Suspense>
                                </EnsureProfile>
                            </AuthProvider>
                        </APIProvider>
                    </QueryClientProvider>
                </StrictMode>
                <Scripts />
            </body>
        </html>
    )
}

function EnsureProfile({ children }: Readonly<{ children: React.ReactNode }>): React.ReactNode {
    useEnsureProfile()
    return children
}
