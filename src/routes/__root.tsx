import bricolageLatinUrl from "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url"
import dmSansLatinUrl from "@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import { APIProvider } from "@vis.gl/react-google-maps"
import { StrictMode, Suspense } from "react"

import { AuthProvider } from "@api/auth-provider"
import { env } from "@core/env"
import { useEnsureProfile } from "@core/session"
import { SessionTimeoutNotice } from "@routes/-components/session-timeout-notice"
import { LoadingPlaceholder } from "@ui/loading"

type RouterContext = {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    head: () => ({
        links: [
            {
                rel: "preload",
                href: bricolageLatinUrl,
                as: "font",
                type: "font/woff2",
                crossOrigin: "anonymous",
            },
            {
                rel: "preload",
                href: dmSansLatinUrl,
                as: "font",
                type: "font/woff2",
                crossOrigin: "anonymous",
            },
        ],
    }),
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
                                    <SessionTimeoutNotice />
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
