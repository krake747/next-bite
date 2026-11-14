import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { warmQueriesWithin } from "@api/convex.options"
import { toId } from "@api/data.model"
import { placeDetailWarmups, placeOptions, usePlaceDetails, type Restaurant } from "@core/restaurants"
import { useToggleWant } from "@core/saves"
import { useAuth } from "@core/session"
import { OpeningHoursDialog } from "@features/restaurants/opening-hours-dialog"
import { PlaceAtmosphere } from "@features/restaurants/place-atmosphere"
import { type EnterpriseDetails, formatBusinessStatus } from "@features/restaurants/place-details-utils"
import { PlaceEnterpriseDetails } from "@features/restaurants/place-enterprise-details"
import { RestaurantGallery } from "@features/restaurants/restaurant-gallery"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { keysForPhotoUrls } from "@pattern/gallery"
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
    const fetchDetails = usePlaceDetails()
    const [showHours, setShowHours] = useState(false)
    const [enterprise, setEnterprise] = useState<
        | { readonly status: "loading" }
        | { readonly status: "ready"; readonly details: EnterpriseDetails }
        | { readonly status: "failed" }
    >({ status: "loading" })
    const [proStatus, setProStatus] = useState<
        | { readonly status: "loading" }
        | { readonly status: "ready"; readonly businessStatus: string | undefined }
        | { readonly status: "failed" }
    >({ status: "loading" })

    const googlePlaceId = restaurant.address.google?.placeId

    useEffect(() => {
        let cancelled = false
        if (googlePlaceId === undefined || googlePlaceId === "") {
            return () => {
                cancelled = true
            }
        }
        setEnterprise({ status: "loading" })
        setProStatus({ status: "loading" })
        void fetchDetails({ placeId: restaurant._id, tier: "enterprise" })
            .then((result) => {
                if (cancelled) {
                    return
                }
                if ("openingHours" in result) {
                    setEnterprise({ status: "ready", details: result })
                } else {
                    setEnterprise({ status: "ready", details: {} })
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setEnterprise({ status: "failed" })
                }
            })
        void fetchDetails({ placeId: restaurant._id, tier: "pro" })
            .then((result) => {
                if (cancelled) {
                    return
                }
                setProStatus({
                    status: "ready",
                    businessStatus: "businessStatus" in result ? result.businessStatus : undefined,
                })
            })
            .catch(() => {
                if (!cancelled) {
                    setProStatus({ status: "failed" })
                }
            })
        return () => {
            cancelled = true
        }
        // fetchDetails is the stable mutateAsync function; refetch only when the place changes.
    }, [restaurant._id, googlePlaceId, fetchDetails])

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
        setShowHours(true)
    }

    const enterpriseDetails = enterprise.status === "ready" ? enterprise.details : undefined
    const openingHours = enterpriseDetails?.openingHours
    const enterpriseFailed = enterprise.status === "failed"
    const closedLabel = proStatus.status === "ready" ? formatBusinessStatus(proStatus.businessStatus) : undefined

    return (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            {closedLabel !== undefined && (
                <p
                    role="status"
                    className="flex items-center gap-2 border-b border-border bg-tomato-50 px-5 py-2.5 text-sm font-medium text-foreground md:px-4"
                >
                    <span className="size-1.5 rounded-full bg-tomato-500" aria-hidden="true" />
                    {closedLabel}
                </p>
            )}
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
                        hasLocation={
                            restaurant.address.google?.placeId !== undefined && restaurant.address.google.placeId !== ""
                        }
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
                        <PlaceEnterpriseDetails details={enterpriseDetails} />
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
                        {enterpriseFailed && (
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
                openingHours={openingHours}
                failed={enterpriseFailed}
                restaurantName={restaurant.name}
            />
        </div>
    )
}

function DetailPhotos({ photos }: Readonly<{ photos: ReadonlyArray<{ readonly url: string }> }>) {
    if (photos.length === 0) {
        return null
    }
    const keys = keysForPhotoUrls(photos.map((photo) => photo.url))
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <h2 className="font-display text-lg font-semibold text-balance text-foreground">Photos</h2>
            <div className="grid grid-cols-3 gap-2 pt-3">
                {photos.map((photo, index) => (
                    <div key={keys[index] ?? photo.url} className="aspect-square overflow-hidden rounded-lg">
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
                <DetailHero key={restaurant._id} restaurant={restaurant} />
                <DetailPhotos photos={restaurant.photos} />
                <PlaceAtmosphere placeId={restaurant._id} googlePlaceId={restaurant.address.google?.placeId} />
            </div>
        </PageContainer>
    )
}
