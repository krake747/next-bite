import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import { type Id } from "@convex/_generated/dataModel"
import {
    useAuth,
    useCreateInvite,
    useGroup,
    useGroupRestaurants,
    useRevokeInvite,
    useRestaurants,
    useShareWithGroup,
    useUnshare,
} from "@core/hooks"
import { clearError, errorFrom, type FormError } from "@core/outcome"
import { orderFeedByRecency, useSocialSummaries } from "@core/social"
import { GroupMembers } from "@features/groups/group-members"
import { PlanMealSection } from "@features/plans/meal-plans"
import { EmptyState } from "@pattern/empty-state"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"
import { LoadingPlaceholder } from "@ui/loading"

export const Route = createFileRoute("/groups/$groupId")({
    head: () => ({ meta: [{ title: "Group details" }] }),
    component: GroupDetail,
})

function GroupNotFound() {
    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/groups" label="Back to groups" />
                <div className="py-16 text-center">
                    <p className="font-display text-2xl font-semibold text-balance text-foreground">Group not found</p>
                    <p className="mt-2 text-sm text-pretty text-muted-foreground">
                        This group does not exist or was never shared with you.
                    </p>
                </div>
            </PageContainer>
        </PageLayout>
    )
}

function AddFromMyList({ groupId, sharedIds }: Readonly<{ groupId: Id<"groups">; sharedIds: ReadonlySet<string> }>) {
    const restaurants = useRestaurants()
    const shareWithGroup = useShareWithGroup()

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
                <Link to="/" viewTransition className="font-medium text-primary hover:underline">
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
                        disabled={shareWithGroup.isPending}
                        onClick={() => {
                            shareWithGroup.mutate({ restaurantId: restaurant._id, groupId })
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
    restaurants: ReturnType<typeof useGroupRestaurants>
    viewer: { readonly kind: "signed-in"; readonly id: string } | { readonly kind: "signed-out" }
}>) {
    const summaries = useSocialSummaries(restaurants === undefined ? [] : restaurants.map((r) => r._id))
    const unshare = useUnshare()

    if (restaurants === undefined) {
        return (
            <div className="pt-4">
                <LoadingPlaceholder />
            </div>
        )
    }
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
                const social = summaries?.get(shared._id)
                return (
                    <li key={shared._id} className="rounded-card border border-border bg-surface p-5 shadow-card">
                        <Link
                            to="/restaurants/$restaurantId"
                            params={{ restaurantId: shared._id }}
                            viewTransition
                            className="font-display text-lg font-semibold text-balance text-foreground hover:text-primary"
                        >
                            {shared.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {shared.cuisine} · {shared.ownerName}
                            {social !== undefined && (social.wantCount > 0 || social.beenCount > 0)
                                ? ` · ${social.wantCount} want · ${social.beenCount} been`
                                : ""}
                        </p>
                        {viewer.kind === "signed-in" && shared.ownerId === viewer.id && (
                            <div className="pt-3">
                                <Button
                                    size="sm"
                                    tone="secondary"
                                    disabled={unshare.isPending}
                                    onClick={() => {
                                        unshare.mutate({
                                            restaurantId: shared._id,
                                            target: { kind: "group", groupId },
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
function GroupInviteSection({ groupId }: Readonly<{ groupId: Id<"groups"> }>) {
    const createInvite = useCreateInvite()
    const revokeInvite = useRevokeInvite()
    type InviteLink = { readonly kind: "none" } | { readonly kind: "ready"; readonly token: string }
    const [token, setToken] = useState<InviteLink>({ kind: "none" })
    const [error, setError] = useState<FormError>(clearError)
    const [copied, setCopied] = useState(false)

    const handleCreate = async () => {
        setError(clearError)
        setCopied(false)
        try {
            const next = await createInvite.mutateAsync({ target: { kind: "group", groupId } })
            setToken(typeof next === "string" && next.length > 0 ? { kind: "ready", token: next } : { kind: "none" })
        } catch (err) {
            setError(errorFrom(err, "Could not create invite link"))
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
            setError(errorFrom(err, "Could not revoke invite link"))
        }
    }

    return (
        <section aria-label="Invite link" className="pt-8">
            <h2 className="font-display text-2xl font-semibold text-balance text-foreground">Invite by link</h2>
            <p className="pt-1 text-sm text-muted-foreground">
                Anyone with the link can join until it expires or is revoked. No email needed.
            </p>
            {token.kind === "none" ? (
                <div className="pt-4">
                    <Button onClick={() => void handleCreate()} disabled={createInvite.isPending}>
                        Create invite link
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
function GroupDetail() {
    const { groupId } = Route.useParams()
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion from router param
    const groupConvexId = groupId as unknown as Id<"groups">
    const auth = useAuth()
    const group = useGroup(groupConvexId)
    const restaurants = useGroupRestaurants(group === null || group === undefined ? null : groupConvexId)

    if (group === null) {
        return <GroupNotFound />
    }

    if (group === undefined || restaurants === undefined) {
        return (
            <PageLayout>
                <PageContainer>
                    <BackNav backTo="/groups" label="Back to groups" />
                    <div className="pt-4">
                        <LoadingPlaceholder />
                    </div>
                </PageContainer>
            </PageLayout>
        )
    }

    const sharedIds = new Set(restaurants.map((p) => p._id))
    const userId = auth.user?.id
    const viewer: { readonly kind: "signed-in"; readonly id: string } | { readonly kind: "signed-out" } =
        userId !== undefined && userId !== "" ? { kind: "signed-in", id: userId } : { kind: "signed-out" }

    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/groups" label="Back to groups" />
                <Header>
                    <HeaderTitle>{group.group.name}</HeaderTitle>
                    <HeaderSubtitle>
                        {group.members.length} {group.members.length === 1 ? "member" : "members"} ·{" "}
                        {group.role === "admin" ? "Admin" : "Member"}
                    </HeaderSubtitle>
                </Header>
                <section aria-label="Members" className="pt-6">
                    <GroupMembers members={group.members.map((m) => ({ name: m.name }))} />
                </section>
                {auth.isAuthenticated && <GroupInviteSection groupId={groupConvexId} />}
                <PlanMealSection groupId={groupConvexId} />
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
        </PageLayout>
    )
}
