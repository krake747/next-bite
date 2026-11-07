import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Suspense, useState } from "react"

import { hasCachedSession } from "@api/auth-store"
import { useSuspenseConvexQuery } from "@api/convex-client"
import { convexQueryOptions } from "@api/convex-options"
import { type Id } from "@api/data-model"
import { api } from "@api/endpoints"
import { useAuth, type Restaurant } from "@core/hooks"
import {
    emptySocial,
    useAddComment,
    useDeleteComment,
    useSocialForRestaurant,
    useToggleInterest,
    useToggleLike,
    type RestaurantSocial,
} from "@core/social"
import { type Viewer } from "@core/social-counts"
import { ShareToGroupDialog } from "@features/groups/share-to-group-dialog"
import { PlanMealSection } from "@features/plans/meal-plans"
import { RestaurantGallery } from "@features/restaurants/restaurant-gallery"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { CommentList } from "@features/social/comment-list"
import { PhotoGallery } from "@features/social/photo-gallery"
import { ReactionBar } from "@features/social/reaction-bar"
import { VisitMemories } from "@features/social/visit-memories"
import { AvatarGroup } from "@pattern/avatar-group"
import { type GalleryPhoto } from "@pattern/gallery"
import { QueryErrorState } from "@pattern/query-error"
import { SocialMetadata } from "@pattern/social-metadata"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
import { OpeningHoursDialog } from "@ui/opening-hours-dialog"

export const Route = createFileRoute("/restaurants/$restaurantId")({
    head: () => ({ meta: [{ title: "Restaurant details" }] }),
    component: RestaurantDetail,
    errorComponent: RestaurantDetailError,
    loader: ({ context, params }) => {
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion from router param
        const restaurantId = params.restaurantId as unknown as Id<"restaurants">
        // Public detail warms for everyone; the social snapshot only when a
        // session exists. Failures stay silent: the Suspense view refetches.
        void context.queryClient
            .query(convexQueryOptions(api.restaurants.getById, { id: restaurantId }))
            .catch(() => {})
        if (hasCachedSession()) {
            void context.queryClient
                .query(convexQueryOptions(api.social.getForRestaurant, { restaurantId }))
                .catch(() => {})
        }
        return null
    },
})

function RestaurantDetailError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/" label="Back to restaurants" />
                <div className="pt-4">
                    <QueryErrorState reset={reset} />
                </div>
            </PageContainer>
        </PageLayout>
    )
}

function asCommentId(id: string): Id<"comments"> {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion from SocialComment ids
    return id as unknown as Id<"comments">
}

function DetailHero({
    restaurant,
    social,
    photos,
    shareAction,
}: Readonly<{
    restaurant: Restaurant
    social: RestaurantSocial
    photos: ReadonlyArray<GalleryPhoto>
    shareAction: React.ReactNode
}>) {
    const navigate = useNavigate()
    const auth = useAuth()
    const toggleInterest = useToggleInterest()
    const toggleLike = useToggleLike()
    const [showHours, setShowHours] = useState(false)

    const goToLogin = () => {
        void navigate({ to: "/login", viewTransition: true })
    }

    const toggleWant = () => {
        if (!auth.isAuthenticated) {
            goToLogin()
            return
        }
        toggleInterest.mutate({ restaurantId: restaurant._id, status: "want" })
    }

    const handleToggleLike = () => {
        if (!auth.isAuthenticated) {
            goToLogin()
            return
        }
        toggleLike.mutate({ restaurantId: restaurant._id })
    }

    return (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="grid divide-border lg:grid-cols-5 lg:divide-x">
                <div className="lg:col-span-3">
                    <RestaurantGallery photos={photos} name={restaurant.name} cuisine={restaurant.cuisine} />
                </div>
                <div className="min-w-0 lg:col-span-2">
                    <RestaurantHeader
                        name={restaurant.name}
                        link={restaurant.details?.link}
                        ownerName={restaurant.ownerName}
                        wantCount={social.wantCount}
                        beenCount={social.beenCount}
                        location={restaurant.address.label}
                        hasLocation={restaurant.address.enrichment?.coords !== undefined}
                        openingHours={restaurant.address.enrichment?.openingHours}
                        onShowHours={() => {
                            setShowHours(true)
                        }}
                    />
                    <div className="flex flex-wrap items-center gap-3 px-5 pb-2 md:px-4">
                        <RestaurantInterestButton
                            wanted={social.wanted}
                            wantCount={social.wantCount}
                            onToggleWant={toggleWant}
                        />
                        <ReactionBar
                            reactions={{
                                liked: social.liked,
                                likeCount: social.likeCount,
                                onToggleLike: handleToggleLike,
                                commentCount: social.comments.length,
                                onComment: () => {},
                                wanted: social.wanted,
                                wantCount: social.wantCount,
                                onToggleWant: toggleWant,
                            }}
                        />
                        {shareAction}
                    </div>
                    <div className="space-y-3 p-5 md:p-4">
                        {restaurant.details?.notes !== undefined && restaurant.details.notes !== "" && (
                            <div>
                                <h2 className="font-display text-lg font-semibold text-balance text-foreground">
                                    Why it&apos;s recommended
                                </h2>
                                <p className="text-body mt-1 leading-relaxed text-pretty text-foreground">
                                    {restaurant.details.notes}
                                </p>
                            </div>
                        )}
                        <SocialMetadata
                            ownerName={restaurant.ownerName}
                            wantCount={social.wantCount}
                            beenCount={social.beenCount}
                        />
                        {social.interestedNames.length > 0 && (
                            <AvatarGroup members={social.interestedNames.map((name) => ({ name }))} />
                        )}
                    </div>
                </div>
            </div>
            <OpeningHoursDialog
                show={showHours}
                onOpenChange={setShowHours}
                openingHours={restaurant.address.enrichment?.openingHours}
                restaurantName={restaurant.name}
            />
        </div>
    )
}

function DetailPhotos({ photos }: Readonly<{ photos: ReadonlyArray<GalleryPhoto> }>) {
    if (photos.length === 0) {
        return null
    }
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <h2 className="font-display text-lg font-semibold text-balance text-foreground">Friends&apos; photos</h2>
            <div className="pt-3">
                <PhotoGallery photos={photos} />
            </div>
        </div>
    )
}

function DetailComments({
    restaurant,
    social,
}: Readonly<{
    restaurant: Restaurant
    social: RestaurantSocial
}>) {
    const auth = useAuth()
    const addComment = useAddComment()
    const deleteComment = useDeleteComment()
    const isAuthenticated = auth.isAuthenticated
    const currentUser = auth.user?.name ?? auth.user?.email ?? undefined
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <CommentList
                comments={social.comments.map((comment) => ({
                    id: comment._id,
                    author: comment.displayName,
                    text: comment.text,
                    time: new Date(comment.createdAt).toLocaleDateString(),
                }))}
                currentUser={currentUser}
                onAdd={
                    isAuthenticated
                        ? (text) => {
                              addComment.mutate({ restaurantId: restaurant._id, text })
                          }
                        : undefined
                }
                onDelete={(id) => {
                    deleteComment.mutate({ id: asCommentId(id) })
                }}
            />
            {!isAuthenticated && (
                <p className="pt-2 text-sm text-muted-foreground">Sign in to join the conversation.</p>
            )}
        </div>
    )
}

function DetailLoading() {
    return (
        <PageLayout>
            <PageContainer>
                <p className="py-16 text-center text-sm text-muted-foreground">Loading…</p>
            </PageContainer>
        </PageLayout>
    )
}

function DetailNotFound() {
    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/" label="Back to restaurants" />
                <div className="py-16 text-center">
                    <p className="font-display text-2xl font-semibold text-balance text-foreground">Spot not found</p>
                    <p className="mt-2 text-sm text-pretty text-muted-foreground">
                        This page went out for snacks and never came back.
                    </p>
                </div>
            </PageContainer>
        </PageLayout>
    )
}

function DetailShare({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const auth = useAuth()
    const [showShare, setShowShare] = useState(false)
    if (!auth.isAuthenticated || auth.user === null || restaurant.ownerId !== auth.user.id) {
        return null
    }
    return (
        <>
            <Button
                tone="secondary"
                onClick={() => {
                    setShowShare(true)
                }}
            >
                Share
            </Button>
            <ShareToGroupDialog
                restaurantId={restaurant._id}
                restaurantName={restaurant.name}
                show={showShare}
                onOpenChange={setShowShare}
            />
        </>
    )
}

function RestaurantDetailView() {
    const { restaurantId } = Route.useParams()
    const auth = useAuth()
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion from router param
    const restaurantConvexId = restaurantId as unknown as Id<"restaurants">
    const restaurant = useSuspenseConvexQuery(api.restaurants.getById, { id: restaurantConvexId })
    const signedInUserId = auth.user?.id
    const viewer: Viewer =
        signedInUserId === undefined ? { kind: "signed-out" } : { kind: "signed-in", id: signedInUserId }
    const restaurantSocial = useSocialForRestaurant(restaurantConvexId, viewer)

    if (restaurant === null) {
        return <DetailNotFound />
    }

    const social = restaurantSocial ?? emptySocial
    const photos = restaurant.images.map((img) => ({ url: img.url, author: img.displayName ?? restaurant.ownerName }))

    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/" label="Back to restaurants" />
                <div className="mx-auto max-w-3xl space-y-6 pt-4 lg:max-w-5xl">
                    <DetailHero
                        restaurant={restaurant}
                        social={social}
                        photos={photos}
                        shareAction={<DetailShare restaurant={restaurant} />}
                    />
                    <DetailPhotos photos={photos} />
                    <PlanMealSection restaurantId={restaurant._id} />
                    <VisitMemories restaurantId={restaurant._id} />
                    <DetailComments restaurant={restaurant} social={social} />
                </div>
            </PageContainer>
        </PageLayout>
    )
}

function RestaurantDetail() {
    return (
        <Suspense fallback={<DetailLoading />}>
            <RestaurantDetailView />
        </Suspense>
    )
}
