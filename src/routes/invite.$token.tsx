import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { isSafeRedirectPath, useAcceptInvite, useAuth, useInvitePreview } from "@core/hooks"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"
import { LoadingPlaceholder } from "@ui/loading"

export const Route = createFileRoute("/invite/$token")({
    head: () => ({ meta: [{ title: "Group invite" }] }),
    component: InvitePage,
})

function InviteError({ message }: Readonly<{ message: string }>) {
    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/" label="Back home" />
                <Header>
                    <HeaderTitle>Invite unavailable</HeaderTitle>
                    <HeaderSubtitle>{message}</HeaderSubtitle>
                </Header>
                <p className="pt-6">
                    <Link to="/" viewTransition className="font-medium text-primary hover:underline">
                        Back to Next Bite
                    </Link>
                </p>
            </PageContainer>
        </PageLayout>
    )
}

function InvitePage() {
    const { token } = Route.useParams()
    const navigate = useNavigate()
    const auth = useAuth()
    const preview = useInvitePreview(token)
    const acceptInvite = useAcceptInvite()
    const [acceptError, setAcceptError] = useState<string | null>(null)
    const [acceptedGroupId, setAcceptedGroupId] = useState<string | null>(null)

    const invitePath = `/invite/${token}`
    const loginHref = `/login?redirect=${encodeURIComponent(invitePath)}`

    useEffect(() => {
        let cancelled = false
        const shouldRun = auth.isAuthenticated && !auth.isLoading && preview !== undefined && acceptedGroupId === null
        if (shouldRun && preview.target.kind === "group") {
            setAcceptError(null)
            acceptInvite
                .mutateAsync({ token })
                .then((result) => {
                    if (cancelled) {
                        return
                    }
                    if (result !== null && typeof result === "object" && "groupId" in result) {
                        const rawGroupId: unknown = result.groupId
                        if (typeof rawGroupId === "string" && rawGroupId !== "") {
                            setAcceptedGroupId(rawGroupId)
                            void navigate({ to: "/groups/$groupId", params: { groupId: rawGroupId }, replace: true })
                        }
                    }
                })
                .catch((error: unknown) => {
                    if (!cancelled) {
                        setAcceptError(error instanceof Error ? error.message : "Could not accept this invite")
                    }
                })
        }
        return () => {
            cancelled = true
        }
    }, [auth.isAuthenticated, auth.isLoading, preview, acceptedGroupId, acceptInvite, token, navigate])

    if (preview === undefined) {
        return (
            <PageLayout>
                <PageContainer>
                    <BackNav backTo="/" label="Back home" />
                    <div className="pt-4">
                        <LoadingPlaceholder />
                    </div>
                </PageContainer>
            </PageLayout>
        )
    }

    if (preview.target.kind !== "group") {
        return <InviteError message="This invite link is for a friend connection. Ask for a group link instead." />
    }

    if (!auth.isAuthenticated) {
        return (
            <PageLayout>
                <PageContainer>
                    <BackNav backTo="/" label="Back home" />
                    <Header>
                        <HeaderTitle>{preview.groupName ?? "A group"} invited you</HeaderTitle>
                        <HeaderSubtitle>
                            {preview.invitedByName} shared a reusable group link. Sign in to join{" "}
                            {preview.groupName ?? "the group"}.
                        </HeaderSubtitle>
                    </Header>
                    <div className="flex flex-col gap-3 pt-6 sm:flex-row">
                        <Button
                            onClick={() => {
                                const redirect = isSafeRedirectPath(invitePath) ? invitePath : "/"
                                void navigate({ to: "/login", search: { redirect }, replace: true })
                            }}
                        >
                            Sign in to join
                        </Button>
                        <Button
                            tone="secondary"
                            onClick={() => {
                                const redirect = isSafeRedirectPath(invitePath) ? invitePath : "/"
                                void navigate({ to: "/signup", search: { redirect }, replace: true })
                            }}
                        >
                            Create an account
                        </Button>
                    </div>
                    <p className="pt-4 text-sm text-muted-foreground">
                        Or continue directly: <a href={loginHref}>/login?redirect={encodeURIComponent(invitePath)}</a>
                    </p>
                </PageContainer>
            </PageLayout>
        )
    }

    if (acceptError !== null) {
        return <InviteError message={acceptError} />
    }

    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/groups" label="Back to groups" />
                <Header>
                    <HeaderTitle>Joining {preview.groupName ?? "the group"}</HeaderTitle>
                    <HeaderSubtitle>Hang tight while we add you.</HeaderSubtitle>
                </Header>
                <div className="pt-4">
                    <LoadingPlaceholder />
                </div>
            </PageContainer>
        </PageLayout>
    )
}
