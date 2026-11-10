import { createFileRoute, Link } from "@tanstack/react-router"
import { Suspense, useState } from "react"

import { useSuspenseConvexQuery } from "@api/convex.context"
import { convexQueryOptions, warmQueriesWithin } from "@api/convex.options"
import { api } from "@api/endpoints"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useRestaurants } from "@core/restaurants"
import { useSessionStatus } from "@core/session"
import { useAcceptFriend, useRemoveFriend, useRequestFriendByEmail } from "@core/social"
import { ButtonLink } from "@pattern/button-link"
import { EmptyState } from "@pattern/empty-state"
import { Header, HeaderSubtitle, HeaderTitle } from "@pattern/header"
import { QueryErrorState } from "@pattern/query-error"
import { FriendsSkeleton } from "@routes/-components/page-skeletons"
import { LOADER_WARM_BUDGET_MS } from "@routes/-components/route-pending"
import { SessionGate } from "@routes/-components/session-gate"
import { PageContainer } from "@routes/-layouts/page-container"
import { Button } from "@ui/button"
import { cx } from "@ui/cva.config"
import { Skeleton } from "@ui/skeleton"
import { control, fieldLabel } from "@ui/variants"

export const Route = createFileRoute("/_app/friends")({
    head: () => ({ meta: [{ title: "Friends - Next Bite" }] }),
    component: FriendsPage,
    errorComponent: FriendsError,
    loader: async ({ context }) => {
        if (context.auth?.isAuthenticated !== true) {
            return null
        }
        await warmQueriesWithin(
            context.queryClient,
            [convexQueryOptions(api.friendships.listFriends), convexQueryOptions(api.friendships.listFriendRequests)],
            LOADER_WARM_BUDGET_MS,
        )
        return null
    },
})

function FriendsError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageContainer>
            <Header>
                <HeaderTitle>Friends</HeaderTitle>
                <HeaderSubtitle>See what your friends are craving. Friend connections live here.</HeaderSubtitle>
            </Header>
            <QueryErrorState reset={reset} />
        </PageContainer>
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
                        if (error.kind === "error") {
                            setError(clearError)
                        }
                        if (sent) {
                            setSent(false)
                        }
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
                        className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
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
                        className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-5 shadow-card"
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
        return (
            <p className="pt-2 text-sm text-muted-foreground">
                When {ownerName} adds restaurants, the latest 5 show up here and in your Home feed.
            </p>
        )
    }
    return (
        <ul className="space-y-1 pt-2">
            {discoveries.map((restaurant) => (
                <li key={restaurant._id}>
                    <Link
                        to="/restaurants/$restaurantId"
                        params={{ restaurantId: restaurant._id }}
                        className="flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm hover:bg-surface-muted focus-visible:bg-surface-muted"
                    >
                        <span className="truncate font-medium text-primary">{restaurant.name}</span>
                        <span className="shrink-0 text-muted-foreground">· {restaurant.cuisine}</span>
                        <span className="sr-only"> by {ownerName}</span>
                    </Link>
                </li>
            ))}
        </ul>
    )
}

function OwnListNudge() {
    const restaurants = useRestaurants()
    // Only relevant before you have anything of your own: once you add places,
    // the loop is running and the nudge would be noise.
    if (restaurants === undefined || restaurants.length > 0) {
        return null
    }
    return (
        <div className="mt-6 flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
                Anything you add to your own lists shows up on your friends&apos; side too.
            </p>
            <ButtonLink to="/add" tone="secondary" size="sm" className="shrink-0">
                Add a restaurant
            </ButtonLink>
        </div>
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
            <OwnListNudge />
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
        <Suspense
            fallback={
                <div className="space-y-1.5 pt-2" aria-hidden="true">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            }
        >
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
        <PageContainer>
            <Header>
                <HeaderTitle>Friends</HeaderTitle>
                <HeaderSubtitle>See what your friends are craving. Friend connections live here.</HeaderSubtitle>
            </Header>
            <SessionGate status={status} context="your friends" fallback={<FriendsSkeleton />}>
                <FriendsView />
            </SessionGate>
        </PageContainer>
    )
}
