import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { warmQueriesWithin } from "@api/convex.options"
import { toId } from "@api/data.model"
import { placeDetailWarmups, placeOptions, usePlaceHours, type Restaurant } from "@core/restaurants"
import { useToggleWant } from "@core/saves"
import { useAuth } from "@core/session"
import { OpeningHoursDialog } from "@features/restaurants/opening-hours-dialog"
import { type OpeningHours } from "@features/restaurants/opening-hours-utils"
import { RestaurantGallery } from "@features/restaurants/restaurant-gallery"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { keyForPhotoUrl } from "@pattern/gallery/photos"
import { LazyImage } from "@pattern/lazy-image"
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
        const restaurantId = toId<"places">(params.restaurantId)
        await warmQueriesWithin(context.queryClient, placeDetailWarmups(restaurantId), LOADER_WARM_BUDGET_MS)
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

function DetailHero({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const navigate = useNavigate()
    const auth = useAuth()
    const toggleWant = useToggleWant(restaurant._id, restaurant.mySave)
    const fetchHours = usePlaceHours()
    const [showHours, setShowHours] = useState(false)
    const [hours, setHours] = useState<OpeningHours | undefined>(undefined)
    const [hoursFailed, setHoursFailed] = useState(false)

    const googlePlaceId = restaurant.address.google?.placeId

    const goToLogin = () => {
        void navigate({ to: "/login" })
    }

    const handleToggleWant = () => {
        if (!auth.isAuthenticated) {
            goToLogin()
            return
        }
        toggleWant()
    }

    const handleShowHours = () => {
        setHoursFailed(false)
        setShowHours(true)
        if (hours === undefined) {
            void fetchHours
                .mutateAsync({ placeId: restaurant._id })
                .then(setHours)
                .catch(() => {
                    setHoursFailed(true)
                })
        }
    }

    return (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="grid divide-border lg:grid-cols-5 lg:divide-x">
                <div className="lg:col-span-3">
                    <RestaurantGallery photos={restaurant.photos} name={restaurant.name} cuisine={restaurant.cuisine} />
                </div>
                <div className="min-w-0 lg:col-span-2">
                    <RestaurantHeader
                        name={restaurant.name}
                        link={restaurant.link}
                        ownerName={restaurant.ownerName}
                        wantCount={restaurant.wantCount}
                        location={restaurant.address.label}
                        hasLocation={restaurant.address.google?.lat !== undefined}
                    />
                    <div className="flex flex-wrap items-center gap-3 px-5 pb-2 md:px-4">
                        <RestaurantInterestButton
                            wanted={restaurant.mySave === "want"}
                            wantCount={restaurant.wantCount}
                            onToggleWant={handleToggleWant}
                        />
                        {googlePlaceId !== undefined && googlePlaceId !== "" && (
                            <Button tone="secondary" onClick={handleShowHours}>
                                Hours
                            </Button>
                        )}
                    </div>
                    <div className="space-y-3 p-5 md:p-4">
                        {restaurant.note !== undefined && restaurant.note !== "" && (
                            <div>
                                <h2 className="font-display text-lg font-semibold text-balance text-foreground">
                                    Why it&apos;s recommended
                                </h2>
                                <p className="text-body mt-1 leading-relaxed text-pretty text-foreground">
                                    {restaurant.note}
                                </p>
                            </div>
                        )}
                        <SocialMetadata ownerName={restaurant.ownerName} wantCount={restaurant.wantCount} />
                        {hoursFailed && (
                            <p role="alert" className="text-sm text-destructive">
                                Could not load opening hours.
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <OpeningHoursDialog
                show={showHours}
                onOpenChange={setShowHours}
                openingHours={hours}
                restaurantName={restaurant.name}
            />
        </div>
    )
}

function DetailPhotos({ photos }: Readonly<{ photos: ReadonlyArray<{ readonly url: string }> }>) {
    if (photos.length === 0) {
        return null
    }
    const seen = new Map<string, number>()
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <h2 className="font-display text-lg font-semibold text-balance text-foreground">Photos</h2>
            <div className="grid grid-cols-3 gap-2 pt-3">
                {photos.map((photo) => (
                    <div key={keyForPhotoUrl(seen, photo.url)} className="aspect-square overflow-hidden rounded-lg">
                        <LazyImage src={photo.url} alt="" ratio={1 / 1} />
                    </div>
                ))}
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

function RestaurantDetailView() {
    const { restaurantId } = Route.useParams()
    const restaurantConvexId = toId<"places">(restaurantId)
    const { data: restaurant } = useSuspenseQuery(placeOptions(restaurantConvexId))

    if (restaurant === null) {
        return <DetailNotFound />
    }

    return (
        <PageContainer>
            <BackNav backTo="/" label="Back to restaurants" />
            <div className="mx-auto max-w-3xl space-y-6 pt-4 lg:max-w-5xl">
                <DetailHero restaurant={restaurant} />
                <DetailPhotos photos={restaurant.photos} />
            </div>
        </PageContainer>
    )
}
