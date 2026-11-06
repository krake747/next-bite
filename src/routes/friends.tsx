import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import {
    useAcceptFriend,
    useAuth,
    useFriendDiscoveries,
    useFriends,
    useFriendRequests,
    useRemoveFriend,
    useRequestFriendByEmail,
} from "@core/hooks"
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
})

function InviteByEmailForm() {
    const requestFriend = useRequestFriendByEmail()
    const [email, setEmail] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)

    const handleInvite = async () => {
        setError(null)
        setSent(false)
        const trimmed = email.trim()
        if (trimmed === "") {
            setError("Enter your friend's email")
            return
        }
        try {
            await requestFriend.mutateAsync({ email: trimmed })
            setEmail("")
            setSent(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not send the request")
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
                    aria-invalid={error !== null}
                    className={cx(control(), error !== null && "border-destructive")}
                />
                {error !== null && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
                {sent && <p className="text-sm text-stone-600">Request sent.</p>}
            </div>
            <Button type="submit" disabled={requestFriend.isPending}>
                Send request
            </Button>
        </form>
    )
}

function RequestsSection() {
    const requests = useFriendRequests()
    const acceptFriend = useAcceptFriend()
    const [error, setError] = useState<string | null>(null)

    if (requests === undefined) {
        return (
            <div className="pt-4">
                <LoadingPlaceholder />
            </div>
        )
    }
    if (requests.incoming.length === 0 && requests.outgoing.length === 0) {
        return null
    }

    const handleAccept = (friendAuthUserId: string) => {
        setError(null)
        acceptFriend.mutate(
            { friendAuthUserId },
            {
                onError: (err) => {
                    setError(err instanceof Error ? err.message : "Could not accept the request")
                },
            },
        )
    }

    return (
        <section aria-label="Friend requests" className="pt-8">
            <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">Requests</h2>
            {error !== null && (
                <p role="alert" className="pt-2 text-sm text-destructive">
                    {error}
                </p>
            )}
            <ul className="grid gap-3 pt-4 md:grid-cols-2">
                {requests.incoming.map((request) => (
                    <li
                        key={request.authUserId}
                        className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-stone-900">{request.name}</p>
                            <p className="text-xs text-stone-600">Wants to be friends</p>
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
                            <p className="truncate text-sm font-medium text-stone-900">{request.name}</p>
                            <p className="text-xs text-stone-600">Request sent</p>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function FriendDiscoveries({ ownerId, ownerName }: Readonly<{ ownerId: string; ownerName: string }>) {
    const discoveries = useFriendDiscoveries(ownerId)
    if (discoveries === undefined) {
        return null
    }
    if (discoveries.length === 0) {
        return <p className="pt-1 text-xs text-stone-600">No discoveries yet.</p>
    }
    return (
        <ul className="space-y-1 pt-2">
            {discoveries.map((restaurant) => (
                <li key={restaurant._id} className="truncate text-sm">
                    <Link
                        to="/restaurants/$restaurantId"
                        params={{ restaurantId: restaurant._id }}
                        viewTransition
                        className="text-tomato-700 hover:underline"
                    >
                        {restaurant.name}
                    </Link>
                    <span className="text-stone-600"> · {restaurant.cuisine}</span>
                    <span className="sr-only"> by {ownerName}</span>
                </li>
            ))}
        </ul>
    )
}

function FriendsList() {
    const friends = useFriends()
    const removeFriend = useRemoveFriend()
    const [error, setError] = useState<string | null>(null)

    if (friends === undefined) {
        return (
            <div className="pt-4">
                <LoadingPlaceholder />
            </div>
        )
    }
    if (friends.length === 0) {
        return (
            <div className="mt-6 rounded-card border border-border bg-surface p-6 text-center shadow-card">
                <p className="font-display text-lg font-semibold text-balance text-stone-900">No friends yet</p>
                <p className="mx-auto mt-1 max-w-md text-sm text-pretty text-stone-600">
                    Invite someone by email above. Their latest shared restaurants land in your home feed.
                </p>
            </div>
        )
    }

    const handleRemove = (friendAuthUserId: string) => {
        setError(null)
        removeFriend.mutate(
            { friendAuthUserId },
            {
                onError: (err) => {
                    setError(err instanceof Error ? err.message : "Could not remove that friend")
                },
            },
        )
    }

    return (
        <>
            {error !== null && (
                <p role="alert" className="pt-4 text-sm text-destructive">
                    {error}
                </p>
            )}
            <ul className="grid gap-4 pt-6 md:grid-cols-2">
                {friends.map((friend) => (
                    <li
                        key={friend.authUserId}
                        className="rounded-card border border-border bg-surface p-5 shadow-card"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="truncate font-display text-lg font-semibold text-balance text-stone-900">
                                {friend.name}
                            </p>
                            <Button
                                size="sm"
                                variant="secondary"
                                disabled={removeFriend.isPending}
                                onClick={() => {
                                    handleRemove(friend.authUserId)
                                }}
                            >
                                Remove
                            </Button>
                        </div>
                        <FriendDiscoveries ownerId={friend.authUserId} ownerName={friend.name} />
                    </li>
                ))}
            </ul>
        </>
    )
}

function FriendsPage() {
    const auth = useAuth()

    return (
        <PageLayout>
            <PageContainer>
                <Header>
                    <HeaderTitle>Friends</HeaderTitle>
                    <HeaderSubtitle>See what your crew is craving. Friend connections live here.</HeaderSubtitle>
                </Header>
                {!auth.isAuthenticated ? (
                    <p className="pt-6 text-stone-600">
                        <Link to="/login" viewTransition className="font-medium text-tomato-700 hover:underline">
                            Sign in
                        </Link>{" "}
                        to see your friends.
                    </p>
                ) : (
                    <>
                        <InviteByEmailForm />
                        <RequestsSection />
                        <section aria-label="Friends" className="pt-8">
                            <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">
                                Your friends
                            </h2>
                            <FriendsList />
                        </section>
                    </>
                )}
            </PageContainer>
        </PageLayout>
    )
}
