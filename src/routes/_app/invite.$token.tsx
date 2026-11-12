import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { inviteOptions, isSafeRedirectPath, useAcceptInvite } from "@core/groups"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useAuth } from "@core/session"
import { Header, HeaderSubtitle, HeaderTitle } from "@pattern/header"
import { LoadingPlaceholder } from "@pattern/loading"
import { QueryErrorState } from "@pattern/query-error"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { Button } from "@ui/button"
import { TextLink } from "@ui/text-link"

export const Route = createFileRoute("/_app/invite/$token")({
    head: () => ({ meta: [{ title: "Group invitation" }] }),
    component: InviteView,
    pendingComponent: InviteLoading,
    errorComponent: InviteLoadError,
})

function InviteLoadError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <>
            <Header>
                <HeaderTitle>Invitation unavailable</HeaderTitle>
                <HeaderSubtitle>This link is invalid, expired, or was revoked.</HeaderSubtitle>
            </Header>
            <PageContainer>
                <BackNav backTo="/" label="Back home" />
                <div className="pt-4">
                    <QueryErrorState reset={reset} />
                </div>
            </PageContainer>
        </>
    )
}

function InviteError({ message }: Readonly<{ message: string }>) {
    return (
        <>
            <Header>
                <HeaderTitle>Invitation unavailable</HeaderTitle>
                <HeaderSubtitle>{message}</HeaderSubtitle>
            </Header>
            <PageContainer>
                <BackNav backTo="/home" label="Back home" />
                <p className="pt-6">
                    <TextLink render={<Link to="/home" />}>Back to Next Bite</TextLink>
                </p>
            </PageContainer>
        </>
    )
}

function InviteView() {
    const { token } = Route.useParams()
    const navigate = useNavigate()
    const auth = useAuth()
    const { data: preview } = useSuspenseQuery(inviteOptions(token))
    const acceptInvite = useAcceptInvite()
    const [acceptError, setAcceptError] = useState<FormError>(clearError)
    const [accepted, setAccepted] = useState(false)

    const invitePath = `/invite/${token}`

    useEffect(() => {
        let cancelled = false
        const shouldRun = auth.isAuthenticated && !auth.isLoading && !accepted
        if (shouldRun && preview.target.kind === "group") {
            setAcceptError(clearError)
            acceptInvite
                .mutateAsync({ token })
                .then((result) => {
                    if (cancelled) {
                        return
                    }
                    if (result !== null && typeof result === "object" && "groupId" in result) {
                        const rawGroupId: unknown = result.groupId
                        if (typeof rawGroupId === "string" && rawGroupId !== "") {
                            setAccepted(true)
                            void navigate({ to: "/groups/$groupId", params: { groupId: rawGroupId }, replace: true })
                        }
                    }
                })
                .catch((error: unknown) => {
                    if (!cancelled) {
                        setAcceptError(errorFrom(error, "Could not accept this invitation"))
                    }
                })
        }
        return () => {
            cancelled = true
        }
    }, [auth.isAuthenticated, auth.isLoading, preview, accepted, acceptInvite, token, navigate])

    if (preview.target.kind !== "group") {
        return <InviteError message="This invitation link is for a friend connection. Ask for a group link instead." />
    }

    if (!auth.isAuthenticated) {
        return (
            <>
                <Header>
                    <HeaderTitle>{preview.groupName ?? "A group"} invited you</HeaderTitle>
                    <HeaderSubtitle>
                        {preview.createdByName} shared a reusable group link. Sign in to join{" "}
                        {preview.groupName ?? "the group"}.
                    </HeaderSubtitle>
                </Header>
                <PageContainer>
                    <BackNav backTo="/" label="Back home" />
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
                            Sign up to join
                        </Button>
                    </div>
                </PageContainer>
            </>
        )
    }

    if (acceptError.kind === "error") {
        return <InviteError message={acceptError.message} />
    }

    return (
        <>
            <Header>
                <HeaderTitle>Joining {preview.groupName ?? "the group"}</HeaderTitle>
                <HeaderSubtitle>Hang tight while we add you.</HeaderSubtitle>
            </Header>
            <PageContainer>
                <BackNav backTo="/groups" label="Back to groups" />
                <div className="pt-4">
                    <LoadingPlaceholder />
                </div>
            </PageContainer>
        </>
    )
}

function InviteLoading() {
    return (
        <PageContainer>
            <BackNav backTo="/" label="Back home" />
            <div className="pt-4">
                <LoadingPlaceholder />
            </div>
        </PageContainer>
    )
}
