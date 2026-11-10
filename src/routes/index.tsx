import { createFileRoute } from "@tanstack/react-router"

import { useConvexQuery } from "@api/convex.context"
import { convexQueryOptions, warmQueries } from "@api/convex.options"
import { api } from "@api/endpoints"
import { useAuth } from "@core/session"
import { BackgroundLayers } from "@pattern/background-decoration"
import { AppInitializing } from "@pattern/loading"
import { redirectSignedIn } from "@routes/-components/auth-redirects"
import { LandingActions, LandingCloser, TasteCards, TasteCardsSkeleton } from "@routes/-components/home-sections"
import { PageContainer } from "@routes/-layouts/page-container"
import { PublicLayout } from "@routes/-layouts/public-layout"

export const Route = createFileRoute("/")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    beforeLoad: ({ context }) => {
        redirectSignedIn(context.auth, "/home")
    },
    component: Home,
    loader: ({ context }) => {
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
    // See ADR-0003: null client during SSR renders skeleton.
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
        <PublicLayout>
            <LandingHero />
            <PageContainer>
                <LandingStatsSection />
                <LandingCloser />
            </PageContainer>
        </PublicLayout>
    )
}

function Home() {
    const auth = useAuth()
    if (auth.isInitializing || auth.isAuthenticated) {
        return <AppInitializing />
    }
    return <SignedOutHome />
}
