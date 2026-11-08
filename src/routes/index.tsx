import { createFileRoute, Navigate } from "@tanstack/react-router"

import { useConvexQuery } from "@api/convex.context"
import { convexQueryOptions, warmQueries } from "@api/convex.options"
import { api } from "@api/endpoints"
import { useAuth } from "@core/session"
import { LandingActions, LandingCloser, TasteCards, TasteCardsSkeleton } from "@routes/-components/home-sections"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { BackgroundLayers } from "@ui/background-decoration"
import { LoadingPlaceholder } from "@ui/loading"

export const Route = createFileRoute("/")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    component: Home,
    loader: ({ context }) => {
        // Public landing stats warm for everyone; the authenticated home at
        // /home rides live collections with their own preload, not this cache.
        warmQueries(context.queryClient, [convexQueryOptions(api.landing.getStats)])
        return null
    },
})

function LandingHero() {
    return (
        <section aria-label="Welcome" className="relative overflow-hidden border-b border-border bg-background">
            <BackgroundLayers />
            <div className="relative mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
                <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
                    Your friends have good taste.
                </h1>
                <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-pretty text-muted-foreground">
                    Save places to eat. See what your friends want to try. Make a plan together.
                </p>
                <LandingActions />
            </div>
        </section>
    )
}

function LandingStatsSection() {
    // Non-suspense on purpose: the Convex client is null during SSR, and the
    // suspense hook throws there. Undefined data renders the same skeleton the
    // Suspense fallback used to, so server HTML stays complete.
    const stats = useConvexQuery(api.landing.getStats)
    if (stats === undefined) {
        return <TasteCardsSkeleton />
    }
    if (stats.totalRestaurants === 0) {
        return null
    }
    return <TasteCards tastes={stats.recentAdds} />
}

function SignedOutHome() {
    return (
        <PageLayout>
            <LandingHero />
            <PageContainer>
                <LandingStatsSection />
                <LandingCloser />
            </PageContainer>
        </PageLayout>
    )
}

function Home() {
    const auth = useAuth()
    // The signed-in home lives at /home under the app layout. The root stays
    // the public landing page for everyone, including crawlers.
    if (auth.isLoading) {
        return <LoadingPlaceholder />
    }
    if (auth.isAuthenticated) {
        return <Navigate to="/home" replace />
    }
    return <SignedOutHome />
}
