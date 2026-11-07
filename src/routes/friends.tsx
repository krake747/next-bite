import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useState } from "react"

import { hasCachedSession } from "@api/auth-store"
import { useSuspenseConvexQuery } from "@api/convex-client"
import { convexQueryOptions } from "@api/convex-options"
import { api } from "@api/endpoints"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useSessionStatus } from "@core/session"
import { useAcceptFriend, useRemoveFriend, useRequestFriendByEmail } from "@core/social"
import { EmptyState } from "@pattern/empty-state"
import { QueryErrorState } from "@pattern/query-error"
import { SignedOutGate } from "@routes/-components/signed-out-gate"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { cx } from "@ui/cva.config"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"
import { LoadingPlaceholder } from "@ui/loading"
import { control, fieldLabel } from "@ui/variants"

export const Route = createFileRoute("/friends")({
    head: () => ({ meta: [{ title: "Friends - Next Bite" }] }),
    component: FriendsPage,
    errorComponent: FriendsError,
    loader: ({ context }) => {
        if (!hasCachedSession()) {
            return null
        }
        // Best-effort warm-up only: the Suspense views below refetch on their own
        // when this has not landed, so a failed warm-up stays silent by design.
        void context.queryClient.query(convexQueryOptions(api.friendships.listFriends)).catch(() => {})
        void context.queryClient.query(convexQueryOptions(api.friendships.listFriendRequests)).catch(() => {})
        return null
    },
})

function FriendsError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Friends</HeaderTitle>
                    <HeaderSubtitle>See what your crew is craving. Friend connections live here.</HeaderSubtitle>
                </Header>
                <QueryErrorState reset={reset} />
            </PageContainer>
        </PageLayout>
    )
}

function InviteByEmailForm() {
    const requestFriend = useRequestFriendByEmail()
    const [email, setEmail] = useState("")
    const [error, setError] = useState<FormError>(clearError)
    const [sent, setSent] = useState(false)

    const handleInvite = async () => {
        setError(clearError)
        setSent(false)
        const trimmed = email.trim()
        if (trimmed === "") {
            setError({ kind: "error", message: "Enter your friend's email" })
            return
        }
        try {
            await requestFriend.mutateAsync({ email: trimmed })
            setEmail("")
            setSent(true)
        } catch (err) {
            setError(errorFrom(err, "Could not send the request"))
        }
    }

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                void handleInvite()
            }}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
            <div className="flex flex-1 flex-col gap-1.5">
                <label htmlFor="friend-email" className={fieldLabel()}>
                    Invite by email
                </label>
                <input
                    id="friend-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                        setEmail(event.target.value)
                    }}
                    placeholder="friend@example.com"
                    maxLength={254}
                    aria-invalid={error.kind === "error"}
                    className={cx(control(), error.kind === "error" && "border-destructive")}
                />
                {error.kind === "error" && (
                    <p role="alert" className="text-sm text-destructive">
                        {error.message}
                    </p>
                )}
                {sent && <p className="text-sm text-muted-foreground">Request sent.</p>}
            </div>
            <Button type="submit" disabled={requestFriend.isPending}>
                Send request
            </Button>
        </form>
    )
}

function RequestsSection() {
    const requests = useSuspenseConvexQuery(api.friendships.listFriendRequests)
    const acceptFriend = useAcceptFriend()
    const [error, setError] = useState<FormError>(clearError)

    if (requests.incoming.length === 0 && requests.outgoing.length === 0) {
        return null
    }

    const handleAccept = (friendAuthUserId: string) => {
        setError(clearError)
        acceptFriend.mutate(
            { friendAuthUserId },
            {
                onError: (err) => {
                    setError(errorFrom(err, "Could not accept the request"))
                },
            },
        )
    }

    return (
        <section aria-label="Friend requests" className="pt-8">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Requests</h2>
            {error.kind === "error" && (
                <p role="alert" className="pt-2 text-sm text-destructive">
                    {error.message}
                </p>
            )}
            <ul className="grid gap-3 pt-4 md:grid-cols-2">
                {requests.incoming.map((request) => (
                    <li
                        key={request.authUserId}
                        className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{request.name}</p>
                            <p className="text-xs text-muted-foreground">Wants to be friends</p>
                        </div>
                        <Button
                            size="sm"
                            disabled={acceptFriend.isPending}
                            onClick={() => {
                                handleAccept(request.authUserId)
                            }}
                        >
                            Accept
                        </Button>
                    </li>
                ))}
                {requests.outgoing.map((request) => (
                    <li
                        key={request.authUserId}
                        className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{request.name}</p>
                            <p className="text-xs text-muted-foreground">Request sent</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function FriendDiscoveries({ ownerId, ownerName }: Readonly<{ ownerId: string; ownerName: string }>) {
    const discoveries = useSuspenseConvexQuery(api.friendships.listDiscoveries, { friendAuthUserId: ownerId })
    if (discoveries.length === 0) {
        return <p className="pt-1 text-xs text-muted-foreground">No discoveries yet.</p>
    }
    return (
        <ul className="space-y-1 pt-2">
            {discoveries.map((restaurant) => (
                <li key={restaurant._id} className="truncate text-sm">
                    <Link
                        to="/restaurants/$restaurantId"
                        params={{ restaurantId: restaurant._id }}
                        viewTransition
                        className="text-primary hover:underline"
                    >
                        {restaurant.name}
                    </Link>
                    <span className="text-muted-foreground"> · {restaurant.cuisine}</span>
                    <span className="sr-only"> by {ownerName}</span>
                </li>
            ))}
        </ul>
    )
}

function FriendsList() {
    const friends = useSuspenseConvexQuery(api.friendships.listFriends)
    const removeFriend = useRemoveFriend()
    const [error, setError] = useState<FormError>(clearError)

    if (friends.length === 0) {
        return (
            <EmptyState
                title="No friends yet"
                body="Invite someone by email above. Their latest shared restaurants land in your home feed."
                className="mt-6"
            />
        )
    }

    const handleRemove = (friendAuthUserId: string) => {
        setError(clearError)
        removeFriend.mutate(
            { friendAuthUserId },
            {
                onError: (err) => {
                    setError(errorFrom(err, "Could not remove that friend"))
                },
            },
        )
    }

    return (
        <>
            {error.kind === "error" && (
                <p role="alert" className="pt-4 text-sm text-destructive">
                    {error.message}
                </p>
            )}
            <ul className="grid gap-4 pt-6 md:grid-cols-2">
                {friends.map((friend) => (
                    <li
                        key={friend.authUserId}
                        className="rounded-card border border-border bg-surface p-5 shadow-card"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-display text-lg font-semibold text-balance text-foreground">
                                {friend.name}
                            </p>
                            <Button
                                size="sm"
                                tone="secondary"
                                disabled={removeFriend.isPending}
                                onClick={() => {
                                    handleRemove(friend.authUserId)
                                }}
                            >
                                Remove
                            </Button>
                        </div>
                        <FriendDiscoveriesBoundary ownerId={friend.authUserId} ownerName={friend.name} />
                    </li>
                ))}
            </ul>
        </>
    )
}

function FriendDiscoveriesBoundary({ ownerId, ownerName }: Readonly<{ ownerId: string; ownerName: string }>) {
    return (
        <Suspense fallback={null}>
            <FriendDiscoveries ownerId={ownerId} ownerName={ownerName} />
        </Suspense>
    )
}

function FriendsView() {
    return (
        <>
            <InviteByEmailForm />
            <RequestsSection />
            <section aria-label="Friends" className="pt-8">
                <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Your friends</h2>
                <FriendsList />
            </section>
        </>
    )
}

function FriendsPage() {
    const status = useSessionStatus()

    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Friends</HeaderTitle>
                    <HeaderSubtitle>See what your crew is craving. Friend connections live here.</HeaderSubtitle>
                </Header>
                {status.kind !== "ready" ? (
                    <SignedOutGate context="your friends">
                        <div className="pt-6">
                            <LoadingPlaceholder />
                        </div>
                    </SignedOutGate>
                ) : (
                    <Suspense
                        fallback={
                            <div className="pt-6">
                                <LoadingPlaceholder />
                            </div>
                        }
                    >
                        <FriendsView />
                    </Suspense>
                )}
            </PageContainer>
        </PageLayout>
    )
}
