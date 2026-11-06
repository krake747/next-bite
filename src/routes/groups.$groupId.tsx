import { createFileRoute, Link } from "@tanstack/react-router"

import { useAuth, useGroup, useGroupRestaurants, useRestaurants, useShareWithGroup, useUnshare } from "@core/hooks"
import { orderFeedByRecency, useSocialSummaries } from "@core/social"
import { GroupMembers } from "@features/groups/group-members"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { Header, HeaderSubtitle, HeaderTitle } from "@ui/header"
import { LoadingPlaceholder } from "@ui/loading"

import { type Id } from "../../convex/_generated/dataModel"

export const Route = createFileRoute("/groups/$groupId")({
    head: () => ({ meta: [{ title: "Group details" }] }),
    component: GroupDetail,
})

function GroupNotFound() {
    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/groups" />
                <div className="py-16 text-center">
                    <p className="font-display text-2xl font-semibold text-balance text-stone-900">Group not found</p>
                    <p className="mt-2 text-sm text-pretty text-stone-600">
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
            <p className="pt-4 text-sm text-stone-600">
                Every restaurant you saved is already on this list.{" "}
                <Link to="/" viewTransition className="font-medium text-tomato-700 hover:underline">
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
                        <p className="truncate text-sm font-medium text-stone-900">{restaurant.name}</p>
                        <p className="text-xs text-stone-600">{restaurant.cuisine}</p>
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
    myId,
}: Readonly<{
    groupId: Id<"groups">
    restaurants: ReturnType<typeof useGroupRestaurants>
    myId: string | null
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
            <div className="mt-4 rounded-card border border-border bg-surface p-6 text-center shadow-card">
                <p className="font-display text-lg font-semibold text-balance text-stone-900">
                    No shared restaurants yet
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-pretty text-stone-600">
                    Add one of your saved restaurants below to start the list.
                </p>
            </div>
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
                            className="font-display text-lg font-semibold text-balance text-stone-900 hover:text-tomato-700"
                        >
                            {shared.name}
                        </Link>
                        <p className="mt-1 text-sm text-stone-600">
                            {shared.cuisine} · {shared.ownerName}
                            {social !== undefined && (social.wantCount > 0 || social.beenCount > 0)
                                ? ` · ${social.wantCount} want · ${social.beenCount} been`
                                : ""}
                        </p>
                        {myId !== null && shared.ownerId === myId && (
                            <div className="pt-3">
                                <Button
                                    size="sm"
                                    variant="secondary"
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
function GroupDetail() {
    const { groupId } = Route.useParams()
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion from router param
    const groupConvexId = groupId as unknown as Id<"groups">
    const auth = useAuth()
    const group = useGroup(groupConvexId)
    const restaurants = useGroupRestaurants(groupConvexId, group !== undefined && group !== null)

    if (group === null) {
        return <GroupNotFound />
    }

    if (group === undefined || restaurants === undefined) {
        return (
            <PageLayout>
                <PageContainer>
                    <BackNav backTo="/groups" />
                    <div className="pt-4">
                        <LoadingPlaceholder />
                    </div>
                </PageContainer>
            </PageLayout>
        )
    }

    const sharedIds = new Set(restaurants.map((p) => p._id))
    const myId = auth.user?.id ?? null

    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/groups" />
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
                <section aria-label="Shared restaurants" className="pt-8">
                    <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">Shared list</h2>
                    <GroupRestaurantsSection groupId={groupConvexId} restaurants={restaurants} myId={myId} />
                </section>
                {auth.isAuthenticated && (
                    <section aria-label="Add your restaurants" className="pt-8">
                        <h2 className="font-display text-2xl font-semibold text-balance text-stone-900">
                            Add your restaurants
                        </h2>
                        <AddFromMyList groupId={groupConvexId} sharedIds={sharedIds} />
                    </section>
                )}
            </PageContainer>
        </PageLayout>
    )
}
