import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { useSuspenseConvexQuery } from "@api/convex.context"
import { convexQueryOptions, warmQueriesWithin } from "@api/convex.options"
import { type Id, toId } from "@api/data.model"
import { api } from "@api/endpoints"
import { useCreateInvite, useRevokeInvite } from "@core/groups"
import { useAddToGroup, useRemoveFromGroup } from "@core/groups"
import { isViewer, useViewer } from "@core/identity"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { useRestaurants, type Restaurant } from "@core/restaurants"
import { orderFeedByRecency } from "@core/saves"
import { useAuth, useSessionStatus } from "@core/session"
import { GroupMembers } from "@features/groups/group-members"
import { PlanSection } from "@features/plans/plans"
import { EmptyState } from "@pattern/empty-state"
import { Header, HeaderSubtitle, HeaderTitle } from "@pattern/header"
import { LoadingPlaceholder } from "@pattern/loading"
import { QueryErrorState } from "@pattern/query-error"
import { LOADER_WARM_BUDGET_MS } from "@routes/-components/route-pending"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { Button } from "@ui/button"

export const Route = createFileRoute("/_app/groups/$groupId")({
    head: () => ({ meta: [{ title: "Group details" }] }),
    component: GroupDetail,
    pendingComponent: GroupDetailLoading,
    errorComponent: GroupDetailError,
    loader: async ({ context, params }) => {
        if (context.auth?.isAuthenticated !== true) {
            return null
        }
        const groupId = toId<"groups">(params.groupId)
        await warmQueriesWithin(
            context.queryClient,
            [convexQueryOptions(api.groups.get, { groupId }), convexQueryOptions(api.places.forGroup, { groupId })],
            LOADER_WARM_BUDGET_MS,
        )
        return null
    },
})

function GroupDetailError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageContainer>
            <BackNav backTo="/groups" label="Back to groups" />
            <div className="pt-4">
                <QueryErrorState reset={reset} />
            </div>
        </PageContainer>
    )
}

function GroupNotFound() {
    return (
        <PageContainer>
            <BackNav backTo="/groups" label="Back to groups" />
            <div className="py-16 text-center">
                <p className="font-display text-2xl font-semibold text-balance text-foreground">Group not found</p>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                    This group does not exist or was never shared with you.
                </p>
            </div>
        </PageContainer>
    )
}

function AddFromMyList({ groupId, sharedIds }: Readonly<{ groupId: Id<"groups">; sharedIds: ReadonlySet<string> }>) {
    const restaurants = useRestaurants()
    const addToGroup = useAddToGroup()

    if (restaurants === undefined) {
        return (
            <div className="pt-4">
                <LoadingPlaceholder />
            </div>
        )
    }
    const candidates = restaurants.filter((r) => !sharedIds.has(r._id))
    if (candidates.length === 0) {
        return (
            <p className="pt-4 text-sm text-muted-foreground">
                Every restaurant you saved is already on this list.{" "}
                <Link to="/home" className="font-medium text-primary hover:underline">
                    Save another one
                </Link>{" "}
                to add it here.
            </p>
        )
    }
    return (
        <ul className="grid gap-3 pt-4 md:grid-cols-2">
            {candidates.map((restaurant) => (
                <li
                    key={restaurant._id}
                    className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface p-4 shadow-card"
                >
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{restaurant.name}</p>
                        <p className="text-xs text-muted-foreground">{restaurant.cuisine}</p>
                    </div>
                    <Button
                        size="sm"
                        disabled={addToGroup.isPending}
                        onClick={() => {
                            addToGroup.mutate({ placeId: restaurant._id, groupId })
                        }}
                    >
                        Add to group
                    </Button>
                </li>
            ))}
        </ul>
    )
}

function GroupRestaurantsSection({
    groupId,
    restaurants,
    viewer,
}: Readonly<{
    groupId: Id<"groups">
    restaurants: ReadonlyArray<Restaurant>
    viewer: { readonly kind: "signed-in"; readonly id: string } | { readonly kind: "signed-out" }
}>) {
    const removeFromGroup = useRemoveFromGroup()

    const feed = orderFeedByRecency(restaurants)
    if (feed.length === 0) {
        return (
            <EmptyState
                title="No shared restaurants yet"
                body="Add one of your saved restaurants below to start the list."
                className="mt-4"
            />
        )
    }
    return (
        <ul className="grid gap-4 pt-4 md:grid-cols-2">
            {feed.map((shared) => {
                return (
                    <li key={shared._id} className="rounded-card border border-border bg-surface p-5 shadow-card">
                        <Link
                            to="/restaurants/$restaurantId"
                            params={{ restaurantId: shared._id }}
                            className="font-display text-lg font-semibold text-balance text-foreground hover:text-primary"
                        >
                            {shared.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {shared.cuisine !== undefined && shared.cuisine !== "" ? `${shared.cuisine} · ` : ""}
                            {shared.ownerName}
                            {shared.wantCount !== 0 ? ` · ${shared.wantCount} want` : ""}
                        </p>
                        {isViewer(viewer, shared.ownerId) && (
                            <div className="pt-3">
                                <Button
                                    size="sm"
                                    tone="secondary"
                                    disabled={removeFromGroup.isPending}
                                    onClick={() => {
                                        removeFromGroup.mutate({
                                            placeId: shared._id,
                                            groupId,
                                        })
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}
type InvitationLink = { readonly kind: "none" } | { readonly kind: "ready"; readonly token: string }

function GroupInviteSection({ groupId }: Readonly<{ groupId: Id<"groups"> }>) {
    const createInvite = useCreateInvite()
    const revokeInvite = useRevokeInvite()
    const [token, setToken] = useState<InvitationLink>({ kind: "none" })
    const [error, setError] = useState<FormError>(clearError)
    const [copied, setCopied] = useState(false)

    const handleCreate = async () => {
        setError(clearError)
        setCopied(false)
        try {
            const next = await createInvite.mutateAsync({ target: { kind: "group", groupId } })
            setToken(typeof next === "string" && next.length > 0 ? { kind: "ready", token: next } : { kind: "none" })
        } catch (err) {
            setError(errorFrom(err, "Could not create invitation link"))
        }
    }

    const handleRevoke = async () => {
        if (token.kind === "none") {
            return
        }
        setError(clearError)
        try {
            await revokeInvite.mutateAsync({ token: token.token })
            setToken({ kind: "none" })
        } catch (err) {
            setError(errorFrom(err, "Could not revoke invitation link"))
        }
    }

    return (
        <section aria-label="Invitation link" className="pt-8">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Share with a link</h2>
            <p className="pt-1 text-sm text-muted-foreground">
                Anyone with the link can join until it expires or is revoked. No email needed.
            </p>
            {token.kind === "none" ? (
                <div className="pt-4">
                    <Button onClick={() => void handleCreate()} disabled={createInvite.isPending}>
                        Create invitation link
                    </Button>
                </div>
            ) : (
                <div className="pt-4">
                    <p className="rounded-card border border-border bg-surface p-3 text-sm break-all text-foreground">
                        {`/invite/${token.token}`}
                    </p>
                    <div className="flex flex-col gap-2 pt-3 sm:flex-row">
                        <Button
                            tone="secondary"
                            onClick={() => {
                                void navigator.clipboard
                                    .writeText(`${window.location.origin}/invite/${token.token}`)
                                    .then(() => {
                                        setCopied(true)
                                    })
                                    .catch(() => {
                                        setCopied(false)
                                    })
                            }}
                        >
                            {copied ? "Copied" : "Copy link"}
                        </Button>
                        <Button tone="secondary" onClick={() => void handleRevoke()} disabled={revokeInvite.isPending}>
                            Revoke link
                        </Button>
                    </div>
                </div>
            )}
            {error.kind === "error" && (
                <p role="alert" className="pt-2 text-sm text-destructive">
                    {error.message}
                </p>
            )}
        </section>
    )
}
function GroupDetailView() {
    const { groupId } = Route.useParams()
    const groupConvexId = toId<"groups">(groupId)
    const auth = useAuth()
    const group = useSuspenseConvexQuery(api.groups.get, { groupId: groupConvexId })
    const restaurants = useSuspenseConvexQuery(api.places.forGroup, { groupId: groupConvexId })
    const viewer = useViewer()

    if (group === null) {
        return <GroupNotFound />
    }

    const sharedIds = new Set(restaurants.map((p) => p._id))

    return (
        <PageContainer>
            <BackNav backTo="/groups" label="Back to groups" />
            <Header>
                <HeaderTitle>{group.group.name}</HeaderTitle>
                <HeaderSubtitle>
                    {group.members.length} {group.members.length === 1 ? "member" : "members"} ·{" "}
                    {group.isOwner ? "Owner" : "Member"}
                </HeaderSubtitle>
            </Header>
            <section aria-label="Members" className="pt-6">
                <GroupMembers members={group.members.map((m) => ({ name: m.name }))} />
            </section>
            {auth.isAuthenticated && <GroupInviteSection groupId={groupConvexId} />}
            <PlanSection groupId={groupConvexId} />
            <section aria-label="Shared restaurants" className="pt-8">
                <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Shared list</h2>
                <GroupRestaurantsSection groupId={groupConvexId} restaurants={restaurants} viewer={viewer} />
            </section>
            {auth.isAuthenticated && (
                <section aria-label="Add your restaurants" className="pt-8">
                    <h2 className="font-display text-2xl font-semibold text-balance text-foreground">
                        Add your restaurants
                    </h2>
                    <AddFromMyList groupId={groupConvexId} sharedIds={sharedIds} />
                </section>
            )}
        </PageContainer>
    )
}

function GroupDetail() {
    const status = useSessionStatus()

    if (status.kind !== "ready") {
        return <GroupDetailLoading />
    }
    return <GroupDetailView />
}

function GroupDetailLoading() {
    return (
        <PageContainer>
            <BackNav backTo="/groups" label="Back to groups" />
            <div className="pt-4">
                <LoadingPlaceholder />
            </div>
        </PageContainer>
    )
}
