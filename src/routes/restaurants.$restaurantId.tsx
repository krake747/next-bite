import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { useRestaurants, useAuth, type Restaurant } from "@core/hooks"
import {
    emptySocial,
    useAddComment,
    useDeleteComment,
    useSocialForRestaurant,
    useToggleInterest,
    useToggleLike,
    type RestaurantSocial,
} from "@core/social"
import { RestaurantGallery } from "@features/restaurants/restaurant-gallery"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { AvatarGroup } from "@features/social/avatar-group"
import { CommentList } from "@features/social/comment-list"
import { PhotoGallery, type GalleryPhoto } from "@features/social/photo-gallery"
import { ReactionBar } from "@features/social/reaction-bar"
import { SocialMetadata } from "@features/social/social-metadata"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { OpeningHoursDialog } from "@ui/opening-hours-dialog"

import { type Id } from "../../convex/_generated/dataModel"

export const Route = createFileRoute("/restaurants/$restaurantId")({
    head: () => ({ meta: [{ title: "Restaurant details" }] }),
    component: RestaurantDetail,
})

function asCommentId(id: string): Id<"comments"> {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion from SocialComment ids
    return id as unknown as Id<"comments">
}

function DetailHero({
    restaurant,
    social,
    photos,
    onToggleWant,
    onToggleLike,
    onShowHours,
}: Readonly<{
    restaurant: Restaurant
    social: RestaurantSocial
    photos: ReadonlyArray<GalleryPhoto>
    onToggleWant: () => void
    onToggleLike: () => void
    onShowHours: () => void
}>) {
    return (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <RestaurantGallery photos={photos} name={restaurant.name} cuisine={restaurant.cuisine} />
            <RestaurantHeader
                name={restaurant.name}
                link={restaurant.link}
                addedBy={restaurant.addedBy}
                wantCount={social.wantCount}
                beenCount={social.beenCount}
                location={restaurant.location}
                hasLocation={restaurant.lat !== null && restaurant.lng !== null}
                openingHours={restaurant.openingHours}
                onShowHours={onShowHours}
            />
            <div className="flex flex-wrap items-center gap-3 px-5 pb-2 md:px-4">
                <RestaurantInterestButton
                    wanted={social.wanted}
                    wantCount={social.wantCount}
                    onToggleWant={onToggleWant}
                />
                <ReactionBar
                    liked={social.liked}
                    likeCount={social.likeCount}
                    onToggleLike={onToggleLike}
                    commentCount={social.comments.length}
                    onComment={() => {}}
                    wanted={social.wanted}
                    wantCount={social.wantCount}
                    onToggleWant={onToggleWant}
                />
            </div>
            <div className="space-y-3 p-5 md:p-4">
                {restaurant.notes !== undefined && restaurant.notes !== "" && (
                    <div>
                        <h2 className="font-display text-lg font-semibold text-balance text-stone-900">
                            Why it&apos;s recommended
                        </h2>
                        <p className="text-body mt-1 leading-relaxed text-pretty text-stone-700">{restaurant.notes}</p>
                    </div>
                )}
                <SocialMetadata
                    addedBy={restaurant.addedBy}
                    wantCount={social.wantCount}
                    beenCount={social.beenCount}
                />
                {social.interestedNames.length > 0 && (
                    <AvatarGroup members={social.interestedNames.map((name) => ({ name }))} />
                )}
            </div>
        </div>
    )
}

function DetailPhotos({ photos }: Readonly<{ photos: ReadonlyArray<GalleryPhoto> }>) {
    if (photos.length === 0) {
        return null
    }
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <h2 className="font-display text-lg font-semibold text-balance text-stone-900">Friends&apos; photos</h2>
            <div className="pt-3">
                <PhotoGallery photos={photos} />
            </div>
        </div>
    )
}

function DetailComments({
    restaurant,
    social,
    isAuthenticated,
    currentUser,
}: Readonly<{
    restaurant: Restaurant
    social: RestaurantSocial
    isAuthenticated: boolean
    currentUser: string | undefined
}>) {
    const addComment = useAddComment()
    const deleteComment = useDeleteComment()
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
            {!isAuthenticated && <p className="pt-2 text-sm text-stone-600">Sign in to join the conversation.</p>}
        </div>
    )
}

function DetailLoading() {
    return (
        <PageLayout>
            <PageContainer>
                <p className="py-16 text-center text-sm text-stone-600">Loading…</p>
            </PageContainer>
        </PageLayout>
    )
}

function DetailNotFound() {
    return (
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/" />
                <div className="py-16 text-center">
                    <p className="font-display text-2xl font-semibold text-balance text-stone-900">Spot not found</p>
                    <p className="mt-2 text-sm text-pretty text-stone-600">
                        This page went out for snacks and never came back.
                    </p>
                </div>
            </PageContainer>
        </PageLayout>
    )
}

function RestaurantDetail() {
    const { restaurantId } = Route.useParams()
    const navigate = useNavigate()
    const auth = useAuth()
    const restaurants = useRestaurants()
    const userId = auth.user?.id ?? null
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion from router param
    const restaurantConvexId = restaurantId as unknown as Id<"restaurants">
    const restaurantSocial = useSocialForRestaurant(restaurantConvexId, userId)
    const toggleInterest = useToggleInterest()
    const toggleLike = useToggleLike()
    const [showHours, setShowHours] = useState(false)

    const restaurant = restaurants?.find((r) => r._id === restaurantId)

    if (restaurants === undefined) {
        return <DetailLoading />
    }

    if (restaurant === undefined) {
        return <DetailNotFound />
    }

    const social = restaurantSocial ?? emptySocial
    const photos = (restaurant.images ?? []).map((img) => ({ url: img.url }))

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
        <PageLayout>
            <PageContainer>
                <BackNav backTo="/" />
                <div className="mx-auto max-w-3xl space-y-6 pt-4">
                    <DetailHero
                        restaurant={restaurant}
                        social={social}
                        photos={photos}
                        onToggleWant={toggleWant}
                        onToggleLike={handleToggleLike}
                        onShowHours={() => {
                            setShowHours(true)
                        }}
                    />
                    <DetailPhotos photos={photos} />
                    <DetailComments
                        restaurant={restaurant}
                        social={social}
                        isAuthenticated={auth.isAuthenticated}
                        currentUser={auth.user?.name ?? auth.user?.email ?? undefined}
                    />
                </div>
            </PageContainer>
            <OpeningHoursDialog
                show={showHours}
                onOpenChange={setShowHours}
                openingHours={restaurant.openingHours}
                restaurantName={restaurant.name}
            />
        </PageLayout>
    )
}
