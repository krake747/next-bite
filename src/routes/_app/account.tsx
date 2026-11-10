import { createFileRoute } from "@tanstack/react-router"

import { hasCachedSession } from "@api/auth.store"
import { convexQueryOptions, warmQueriesWithin } from "@api/convex.options"
import { api } from "@api/endpoints"
import { useSessionStatus } from "@core/session"
import { UserDetailsSection } from "@features/account/profile-card"
import { Header, HeaderSubtitle, HeaderTitle } from "@pattern/header"
import { QueryErrorState } from "@pattern/query-error"
import { ProfileSkeleton } from "@routes/-components/page-skeletons"
import { LOADER_WARM_BUDGET_MS } from "@routes/-components/route-pending"
import { SessionGate } from "@routes/-components/session-gate"
import { PageContainer } from "@routes/-layouts/page-container"

export const Route = createFileRoute("/_app/account")({
    head: () => ({ meta: [{ title: "Account - Next Bite" }] }),
    component: AccountPage,
    errorComponent: AccountError,
    loader: async ({ context }) => {
        if (!hasCachedSession()) {
            return null
        }
        await warmQueriesWithin(context.queryClient, [convexQueryOptions(api.users.getMe)], LOADER_WARM_BUDGET_MS)
        return null
    },
})

function AccountError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageContainer>
            <Header>
                <HeaderTitle>Account</HeaderTitle>
                <HeaderSubtitle>Your profile details.</HeaderSubtitle>
            </Header>
            <QueryErrorState reset={reset} />
        </PageContainer>
    )
}

function AccountPage() {
    const status = useSessionStatus()

    return (
        <PageContainer>
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
                <section aria-label="Account" className="px-4 pt-8 sm:pt-10">
                    <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                        Account
                    </h1>
                </section>
                <SessionGate status={status} context="your details" fallback={<ProfileSkeleton />}>
                    <UserDetailsSection />
                </SessionGate>
            </div>
        </PageContainer>
    )
}
