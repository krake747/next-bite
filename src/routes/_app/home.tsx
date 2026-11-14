import { PlusIcon } from "@phosphor-icons/react"
import { Link, createFileRoute } from "@tanstack/react-router"

import { useMyGroups } from "@core/groups"
import { useViewer } from "@core/identity"
import { preloadHomeCollections, useFeedRestaurants, useRestaurants, type Restaurant } from "@core/restaurants"
import { orderFeedByRecency } from "@core/saves"
import { useAuth, useSessionStatus } from "@core/session"
import { RestaurantCard } from "@features/restaurants/restaurant-card"
import { RestaurantList } from "@features/restaurants/restaurant-list"
import { ActivityPost } from "@features/social/activity-post"
import { ButtonLink } from "@pattern/button-link"
import { EmptyState } from "@pattern/empty-state"
import { QueryErrorState } from "@pattern/query-error"
import { HomeSkeleton } from "@routes/-components/page-skeletons"
import { SessionGate } from "@routes/-components/session-gate"
import { SocialActionsProvider, useSocialActions } from "@routes/-components/social-actions-provider"
import { PageContainer } from "@routes/-layouts/page-container"
import { TextLink } from "@ui/text-link"

export const Route = createFileRoute("/_app/home")({
    head: () => ({ meta: [{ title: "Our next bite" }] }),
    loader: ({ context }) => {
        preloadHomeCollections(context.queryClient)
    },
    component: HomePage,
    errorComponent: HomeError,
})

function HomeError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageContainer>
            <QueryErrorState reset={reset} />
        </PageContainer>
    )
}

type HomeGroup = {
    readonly group: {
        readonly _id: string
        readonly name: string
    }
}

function SectionTitle({ children }: Readonly<{ children: React.ReactNode }>) {
    return <h2 className="font-display text-xl font-semibold text-balance text-foreground sm:text-2xl">{children}</h2>
}

function HomePlans({ groups }: Readonly<{ groups: ReadonlyArray<HomeGroup> | undefined }>) {
    if (groups === undefined) {
        return null
    }
    if (groups.length === 0) {
        return (
            <section aria-label="Your plans" className="pt-8">
                <SectionTitle>Your plans</SectionTitle>
                <EmptyState
                    title="No plans yet"
                    body="Create a plan, invite friends, and collect suggestions in one place."
                    className="mt-4"
                />
            </section>
        )
    }
    return (
        <section aria-label="Your plans" className="pt-8">
            <div className="flex items-baseline justify-between gap-4">
                <SectionTitle>Your plans</SectionTitle>
                <TextLink render={<Link to="/groups" />}>View all groups</TextLink>
            </div>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
                {groups.slice(0, 3).map(({ group }) => (
                    <li
                        key={group._id}
                        className="rounded-card border border-border bg-surface p-5 shadow-card transition-transform duration-150 active:scale-[0.96]"
                    >
                        <Link
                            to="/groups/$groupId"
                            params={{ groupId: group._id }}
                            className="font-display text-lg font-semibold text-balance text-foreground hover:text-primary"
                        >
                            {group.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">Open the group to propose a time</p>
                    </li>
                ))}
            </ul>
        </section>
    )
}

function HomeActivity({ feed }: Readonly<{ feed: ReadonlyArray<Restaurant> }>) {
    if (feed.length === 0) {
        return null
    }
    return (
        <section aria-label="Friends activity" className="pt-8">
            <SectionTitle>Friends activity</SectionTitle>
            <p className="mt-1 text-muted-foreground">What friends are saving, newest first.</p>
            <div className="flex flex-col gap-4 pt-4 sm:gap-6">
                {feed.map((restaurant) => (
                    <HomeActivityItem key={restaurant._id} restaurant={restaurant} />
                ))}
            </div>
        </section>
    )
}

function HomeActivityItem({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const actions = useSocialActions()
    return <ActivityPost restaurant={restaurant} {...actions.activityFor(restaurant)} />
}

function HomeShortlist({ mine, feedCount }: Readonly<{ mine: ReadonlyArray<Restaurant>; feedCount: number }>) {
    const actions = useSocialActions()
    if (mine.length === 0 && feedCount === 0) {
        return (
            <section aria-label="Saved restaurants" className="pt-8">
                <SectionTitle>Saved restaurants</SectionTitle>
                <p className="mt-1 text-muted-foreground">Every restaurant on your short list.</p>
                <div className="pt-4">
                    <RestaurantList restaurants={[]} />
                </div>
            </section>
        )
    }
    if (mine.length === 0) {
        return (
            <section aria-label="Saved restaurants" className="pt-8">
                <SectionTitle>Saved restaurants</SectionTitle>
                <EmptyState
                    title="Nothing saved yet"
                    body="Share your first spot to start your short list."
                    className="mt-4"
                />
            </section>
        )
    }
    return (
        <section aria-label="Saved restaurants" className="pt-8">
            <SectionTitle>Saved restaurants</SectionTitle>
            <p className="mt-1 text-muted-foreground">Every restaurant on your short list.</p>
            <div className="grid gap-4 pt-4 sm:gap-8 md:grid-cols-2 md:gap-10">
                {mine.map((restaurant) => (
                    <RestaurantCard key={restaurant._id} restaurant={restaurant} {...actions.cardFor(restaurant)} />
                ))}
            </div>
        </section>
    )
}

function HomeHeader({
    name,
    savedCount,
    friendCount,
}: Readonly<{ name: string; savedCount: number; friendCount: number }>) {
    return (
        <section aria-label="Welcome back" className="pt-8 sm:pt-10">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl">
                Pick your next table, {name}.
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
                {savedCount === 0 && friendCount === 0 ? (
                    "Save your first spots and plan the first outing together."
                ) : (
                    <>
                        <span className="font-semibold text-foreground tabular-nums">{savedCount}</span>{" "}
                        {savedCount === 1 ? "place" : "places"} to try ·{" "}
                        <span className="font-semibold text-foreground tabular-nums">{friendCount}</span>{" "}
                        {friendCount === 1 ? "save" : "saves"} from friends
                    </>
                )}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ButtonLink to="/groups" className="w-full sm:w-auto">
                    <PlusIcon className="size-4" />
                    Create plan
                </ButtonLink>
                <div className="flex items-center gap-4">
                    <ButtonLink to="/add" tone="secondary">
                        Share restaurant
                    </ButtonLink>
                    <TextLink render={<Link to="/friends" />}>Invite friends</TextLink>
                </div>
            </div>
        </section>
    )
}

function HomeSections({
    mine,
    feed,
    groups,
}: Readonly<{
    mine: ReadonlyArray<Restaurant>
    feed: ReadonlyArray<Restaurant>
    groups: ReadonlyArray<HomeGroup> | undefined
}>) {
    const viewer = useViewer()
    const ownId = viewer.kind === "signed-in" ? viewer.id : undefined
    const mineIds = new Set(mine.map((restaurant) => restaurant._id))
    const feedOnly = feed.filter((restaurant) => restaurant.ownerId !== ownId && !mineIds.has(restaurant._id))
    return (
        <SocialActionsProvider>
            <HomePlans groups={groups} />
            <HomeActivity feed={feedOnly} />
            <HomeShortlist mine={mine} feedCount={feedOnly.length} />
        </SocialActionsProvider>
    )
}

function HomeContent() {
    const restaurants = useRestaurants()
    const feedRestaurants = useFeedRestaurants()
    const groups = useMyGroups()
    const auth = useAuth()
    const restaurantListState = restaurants ?? []
    const feed = orderFeedByRecency(feedRestaurants ?? [])

    if (restaurants === undefined || feedRestaurants === undefined) {
        return <HomeSkeleton />
    }
    return (
        <div className="mx-auto w-full max-w-3xl pb-[env(safe-area-inset-bottom)]">
            <HomeHeader
                name={auth.user?.name?.split(" ")[0] ?? "food lover"}
                savedCount={restaurantListState.length}
                friendCount={feed.length}
            />
            <HomeSections mine={restaurantListState} feed={feed} groups={groups} />
        </div>
    )
}

function HomePage() {
    const status = useSessionStatus()
    return (
        <PageContainer>
            <SessionGate status={status} context="your next bite" fallback={<HomeSkeleton />}>
                <HomeContent />
            </SessionGate>
        </PageContainer>
    )
}
