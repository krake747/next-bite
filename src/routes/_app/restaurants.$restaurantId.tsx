import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { useSuspenseConvexQuery } from "@api/convex.context"
import { convexQueryOptions, warmQueriesWithin } from "@api/convex.options"
import { toId } from "@api/data.model"
import { api } from "@api/endpoints"
import { type Restaurant } from "@core/restaurants"
import { useAuth } from "@core/session"
import { emptySocial, useSocialForRestaurant, useToggleInterest, type RestaurantSocial } from "@core/social"
import { type Viewer } from "@core/social.counts"
import { ShareToGroupDialog } from "@features/groups/share-to-group-dialog"
import { PlanSection } from "@features/plans/plans"
import { OpeningHoursDialog } from "@features/restaurants/opening-hours-dialog"
import { RestaurantForm, useFormDiscard } from "@features/restaurants/restaurant-form"
import { RestaurantGallery } from "@features/restaurants/restaurant-gallery"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { PhotoGallery } from "@features/social/photo-gallery"
import { AvatarGroup } from "@pattern/avatar-group"
import { type GalleryPhoto } from "@pattern/gallery"
import { LoadingPlaceholder } from "@pattern/loading"
import { QueryErrorState } from "@pattern/query-error"
import { SocialMetadata } from "@pattern/social-metadata"
import { LOADER_WARM_BUDGET_MS } from "@routes/-components/route-pending"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import { Button } from "@ui/button"

export const Route = createFileRoute("/_app/restaurants/$restaurantId")({
    head: () => ({ meta: [{ title: "Restaurant details" }] }),
    component: RestaurantDetailView,
    pendingComponent: DetailLoading,
    errorComponent: RestaurantDetailError,
    loader: async ({ context, params }) => {
        const restaurantId = toId<"restaurants">(params.restaurantId)
        const detail = convexQueryOptions(api.restaurants.getById, { id: restaurantId })
        const social = convexQueryOptions(api.social.getForRestaurant, { restaurantId })
        await warmQueriesWithin(
            context.queryClient,
            context.auth?.isAuthenticated === true ? [detail, social] : [detail],
            LOADER_WARM_BUDGET_MS,
        )
        return null
    },
})

function RestaurantDetailError({ reset }: Readonly<{ reset: () => void }>) {
    return (
        <PageContainer>
            <BackNav backTo="/" label="Back to restaurants" />
            <div className="pt-4">
                <QueryErrorState reset={reset} />
            </div>
        </PageContainer>
    )
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
    const [showHours, setShowHours] = useState(false)
    const [editing, setEditing] = useState(false)
    const isOwner = auth.isAuthenticated && auth.user !== null && restaurant.ownerId === auth.user.id

    const goToLogin = () => {
        void navigate({ to: "/login" })
    }

    const toggleWant = () => {
        if (!auth.isAuthenticated) {
            goToLogin()
            return
        }
        toggleInterest.mutate({ restaurantId: restaurant._id, status: "want" })
    }

    return (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {editing ? (
                <DetailEditForm
                    restaurant={restaurant}
                    onDone={() => {
                        setEditing(false)
                    }}
                />
            ) : (
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
                            {isOwner && (
                                <Button
                                    tone="secondary"
                                    onClick={() => {
                                        setEditing(true)
                                    }}
                                >
                                    Edit
                                </Button>
                            )}
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
            )}
            <OpeningHoursDialog
                show={showHours}
                onOpenChange={setShowHours}
                openingHours={restaurant.address.enrichment?.openingHours}
                restaurantName={restaurant.name}
            />
        </div>
    )
}

function DetailEditForm({ restaurant, onDone }: Readonly<{ restaurant: Restaurant; onDone: () => void }>) {
    const { registerDiscard, discard } = useFormDiscard()
    return (
        <div className="p-5 md:p-4">
            <RestaurantForm
                mode="edit"
                restaurant={restaurant}
                onSuccess={onDone}
                onCancel={() => {
                    void discard().then(onDone)
                }}
                onDiscardReady={registerDiscard}
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

function DetailLoading() {
    return (
        <PageContainer>
            <BackNav backTo="/" label="Back to restaurants" />
            <div className="pt-4">
                <LoadingPlaceholder />
            </div>
        </PageContainer>
    )
}

function DetailNotFound() {
    return (
        <PageContainer>
            <BackNav backTo="/" label="Back to restaurants" />
            <div className="py-16 text-center">
                <p className="font-display text-2xl font-semibold text-balance text-foreground">Restaurant not found</p>
                <p className="mt-2 text-sm text-pretty text-muted-foreground">
                    This page went out for snacks and never came back.
                </p>
            </div>
        </PageContainer>
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
    const restaurantConvexId = toId<"restaurants">(restaurantId)
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
                <PlanSection restaurantId={restaurant._id} />
            </div>
        </PageContainer>
    )
}
