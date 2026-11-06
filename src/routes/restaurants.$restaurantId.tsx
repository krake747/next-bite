import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { useVisibleRestaurant, useAuth, type Restaurant } from "@core/hooks"
import {
    emptySocial,
    useAddComment,
    useDeleteComment,
    useSocialForRestaurant,
    useToggleInterest,
    useToggleLike,
    type RestaurantSocial,
} from "@core/social"
import { ShareToGroupDialog } from "@features/groups/share-to-group-dialog"
import { RestaurantGallery } from "@features/restaurants/restaurant-gallery"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { CommentList } from "@features/social/comment-list"
import { PhotoGallery } from "@features/social/photo-gallery"
import { ReactionBar } from "@features/social/reaction-bar"
import { SocialMetadata } from "@features/social/social-metadata"
import { AvatarGroup } from "@pattern/avatar-group"
import { type GalleryPhoto } from "@pattern/gallery/photos"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { PageLayout } from "@routes/-layouts/page-layout"
import { Button } from "@ui/button"
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
    shareAction,
}: Readonly<{
    restaurant: Restaurant
    social: RestaurantSocial
    photos: ReadonlyArray<GalleryPhoto>
    onToggleWant: () => void
    onToggleLike: () => void
    onShowHours: () => void
    shareAction: React.ReactNode
}>) {
    return (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <RestaurantGallery photos={photos} name={restaurant.name} cuisine={restaurant.cuisine} />
            <RestaurantHeader
                name={restaurant.name}
                link={restaurant.details?.link}
                ownerName={restaurant.ownerName}
                wantCount={social.wantCount}
                beenCount={social.beenCount}
                location={restaurant.address.label}
                hasLocation={restaurant.address.enrichment?.coords !== undefined}
                openingHours={restaurant.address.enrichment?.openingHours}
                onShowHours={onShowHours}
            />
            <div className="flex flex-wrap items-center gap-3 px-5 pb-2 md:px-4">
                <RestaurantInterestButton
                    wanted={social.wanted}
                    wantCount={social.wantCount}
                    onToggleWant={onToggleWant}
                />
                <ReactionBar
                    reactions={{
                        liked: social.liked,
                        likeCount: social.likeCount,
                        onToggleLike,
                        commentCount: social.comments.length,
                        onComment: () => {},
                        wanted: social.wanted,
                        wantCount: social.wantCount,
                        onToggleWant,
                    }}
                />
                {shareAction}
            </div>
            <div className="space-y-3 p-5 md:p-4">
                {restaurant.details?.notes !== undefined && restaurant.details.notes !== "" && (
                    <div>
                        <h2 className="font-display text-lg font-semibold text-balance text-stone-900">
                            Why it&apos;s recommended
                        </h2>
                        <p className="text-body mt-1 leading-relaxed text-pretty text-stone-700">
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
                <BackNav backTo="/" label="Back to restaurants" />
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

function DetailShare({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const auth = useAuth()
    const [showShare, setShowShare] = useState(false)
    if (!auth.isAuthenticated || auth.user === null || restaurant.ownerId !== auth.user.id) {
        return null
    }
    return (
        <>
            <Button
                variant="secondary"
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

function RestaurantDetail() {
    const { restaurantId } = Route.useParams()
    const navigate = useNavigate()
    const auth = useAuth()
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- single documented boundary conversion from router param
    const restaurantConvexId = restaurantId as unknown as Id<"restaurants">
    const restaurant = useVisibleRestaurant(restaurantConvexId)
    const userId = auth.user?.id ?? null
    const restaurantSocial = useSocialForRestaurant(restaurantConvexId, userId)
    const toggleInterest = useToggleInterest()
    const toggleLike = useToggleLike()
    const [showHours, setShowHours] = useState(false)

    if (restaurant === undefined || auth.isLoading) {
        return <DetailLoading />
    }

    if (restaurant === null) {
        return <DetailNotFound />
    }

    const social = restaurantSocial ?? emptySocial
    const photos = restaurant.images.map((img) => ({ url: img.url }))

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
                <BackNav backTo="/" label="Back to restaurants" />
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
                        shareAction={<DetailShare restaurant={restaurant} />}
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
                openingHours={restaurant.address.enrichment?.openingHours}
                restaurantName={restaurant.name}
            />
        </PageLayout>
    )
}
