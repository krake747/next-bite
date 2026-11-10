import bricolageLatinUrl from "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url"
import dmSansLatinUrl from "@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import { APIProvider } from "@vis.gl/react-google-maps"
import { StrictMode, Suspense } from "react"

import { AuthProvider } from "@api/auth.provider"
import { env } from "@core/env"
import { usePublishReadySession } from "@core/restaurants"
import { useEnsureProfile } from "@core/session"
import { AppInitializing } from "@pattern/loading"
import { RouteProgress } from "@routes/-components/route-pending"
import { SessionTimeoutNotice } from "@routes/-components/session-timeout-notice"

import fontsCss from "../fonts.css?url"
import appCss from "../index.css?url"

type RouterContext = {
    queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
    head: () => ({
        meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
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
            { rel: "stylesheet", href: fontsCss },
            { rel: "stylesheet", href: appCss },
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
                            <Suspense fallback={<AppInitializing />}>
                                <AuthProvider>
                                    <SessionEffects>
                                        <RouteProgress />
                                        <SessionTimeoutNotice />
                                        <Outlet />
                                    </SessionEffects>
                                </AuthProvider>
                            </Suspense>
                        </APIProvider>
                    </QueryClientProvider>
                </StrictMode>
                <Scripts />
            </body>
        </html>
    )
}

function SessionEffects({ children }: Readonly<{ children: React.ReactNode }>): React.ReactNode {
    useEnsureProfile()
    usePublishReadySession()
    return children
}
