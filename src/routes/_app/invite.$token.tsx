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

function InviteError({ message, onRetry }: Readonly<{ message: string; onRetry?: (() => void) | undefined }>) {
    return (
        <>
            <Header>
                <HeaderTitle>Invitation unavailable</HeaderTitle>
                <HeaderSubtitle>{message}</HeaderSubtitle>
            </Header>
            <PageContainer>
                <BackNav backTo="/home" label="Back home" />
                <div className="flex flex-col gap-3 pt-6 sm:flex-row">
                    {onRetry !== undefined && <Button onClick={onRetry}>Try again</Button>}
                    <TextLink render={<Link to="/home" />}>Back to Next Bite</TextLink>
                </div>
            </PageContainer>
        </>
    )
}

type AcceptDestination =
    | { readonly kind: "group"; readonly groupId: string }
    | { readonly kind: "friend" }
    | { readonly kind: "unknown" }

function acceptDestinationOf(result: unknown): AcceptDestination {
    if (result === null || typeof result !== "object") {
        return { kind: "unknown" }
    }
    if ("groupId" in result && typeof result.groupId === "string" && result.groupId !== "") {
        return { kind: "group", groupId: result.groupId }
    }
    if ("friendId" in result && typeof result.friendId === "string" && result.friendId !== "") {
        return { kind: "friend" }
    }
    return { kind: "unknown" }
}

function InviteSignInPrompt({
    isFriendInvite,
    invitePath,
    createdByName,
    groupName,
}: Readonly<{
    isFriendInvite: boolean
    invitePath: string
    createdByName: string
    groupName: string | undefined
}>) {
    const navigate = useNavigate()
    const goToAuth = (to: "/login" | "/signup") => {
        const redirect = isSafeRedirectPath(invitePath) ? invitePath : "/"
        void navigate({ to, search: { redirect }, replace: true })
    }
    return (
        <>
            <Header>
                <HeaderTitle>
                    {isFriendInvite ? `${createdByName} invited you` : `${groupName ?? "A group"} invited you`}
                </HeaderTitle>
                <HeaderSubtitle>
                    {isFriendInvite ? (
                        "Sign in to accept this friend invitation."
                    ) : (
                        <>
                            {createdByName} shared a reusable group link. Sign in to join {groupName ?? "the group"}.
                        </>
                    )}
                </HeaderSubtitle>
            </Header>
            <PageContainer>
                <BackNav backTo="/" label="Back home" />
                <div className="flex flex-col gap-3 pt-6 sm:flex-row">
                    <Button
                        onClick={() => {
                            goToAuth("/login")
                        }}
                    >
                        {isFriendInvite ? "Sign in to accept" : "Sign in to join"}
                    </Button>
                    <Button
                        tone="secondary"
                        onClick={() => {
                            goToAuth("/signup")
                        }}
                    >
                        {isFriendInvite ? "Sign up to accept" : "Sign up to join"}
                    </Button>
                </div>
            </PageContainer>
        </>
    )
}

function AcceptingInvite({
    isFriendInvite,
    groupName,
}: Readonly<{ isFriendInvite: boolean; groupName: string | undefined }>) {
    return (
        <>
            <Header>
                <HeaderTitle>
                    {isFriendInvite ? "Accepting invitation" : `Joining ${groupName ?? "the group"}`}
                </HeaderTitle>
                <HeaderSubtitle>
                    {isFriendInvite ? "Hang tight while we connect you." : "Hang tight while we add you."}
                </HeaderSubtitle>
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

function InviteView() {
    const { token } = Route.useParams()
    const navigate = useNavigate()
    const auth = useAuth()
    const { data: preview } = useSuspenseQuery(inviteOptions(token))
    const acceptInvite = useAcceptInvite()
    const [acceptError, setAcceptError] = useState<FormError>(clearError)
    const [accepted, setAccepted] = useState(false)
    const [retryCount, setRetryCount] = useState(0)

    const invitePath = `/invite/${token}`
    const isFriendInvite = preview.target.kind === "friend"

    useEffect(() => {
        let cancelled = false
        const shouldRun = auth.isAuthenticated && !auth.isLoading && !accepted
        if (shouldRun) {
            setAcceptError(clearError)
            acceptInvite
                .mutateAsync({ token })
                .then((result) => {
                    if (cancelled) {
                        return
                    }
                    const destination = acceptDestinationOf(result)
                    if (destination.kind === "group") {
                        setAccepted(true)
                        void navigate({
                            to: "/groups/$groupId",
                            params: { groupId: destination.groupId },
                            replace: true,
                        })
                        return
                    }
                    if (destination.kind === "friend") {
                        setAccepted(true)
                        void navigate({ to: "/friends", replace: true })
                        return
                    }
                    setAcceptError(errorFrom(undefined, "Could not accept this invitation"))
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
    }, [auth.isAuthenticated, auth.isLoading, preview, accepted, acceptInvite, token, navigate, retryCount])

    const handleRetry = () => {
        setRetryCount((count) => count + 1)
    }

    if (!auth.isAuthenticated) {
        return (
            <InviteSignInPrompt
                isFriendInvite={isFriendInvite}
                invitePath={invitePath}
                createdByName={preview.createdByName}
                groupName={preview.groupName}
            />
        )
    }

    if (acceptError.kind === "error") {
        return <InviteError message={acceptError.message} onRetry={handleRetry} />
    }

    return <AcceptingInvite isFriendInvite={isFriendInvite} groupName={preview.groupName} />
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
