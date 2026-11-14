import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { lazy, Suspense } from "react"

import { warmQueriesWithin } from "@api/convex.options"
import { toId } from "@api/data.model"
import { useViewer } from "@core/identity"
import { placeDetailWarmups, placeOptions, type Restaurant } from "@core/restaurants"
import { useToggleWant } from "@core/saves"
import { useAuth } from "@core/session"
import { OpeningHoursDialog } from "@features/restaurants/opening-hours-dialog"
import { type EnterpriseDetails } from "@features/restaurants/place-details-utils"
import { PlaceEnterpriseDetails } from "@features/restaurants/place-enterprise-details"
import { RestaurantGallery } from "@features/restaurants/restaurant-gallery"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { useDetailEnterprise } from "@features/restaurants/use-detail-enterprise"
import { useVisible } from "@features/restaurants/use-visible"
import { LoadingPlaceholder } from "@pattern/loading"
import { QueryErrorState } from "@pattern/query-error"
import { SocialMetadata } from "@pattern/social-metadata"
import { LOADER_WARM_BUDGET_MS } from "@routes/-components/route-pending"
import { BackNav } from "@routes/-layouts/back-nav"
import { PageContainer } from "@routes/-layouts/page-container"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@ui/breadcrumb"
import { Button } from "@ui/button"

const RestaurantCardMap = lazy(async () =>
    import("@features/restaurants/restaurant-card-map").then((module) => ({ default: module.RestaurantCardMap })),
)

export const Route = createFileRoute("/_app/restaurants/$restaurantId")({
    ssr: false,
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

function DetailInfoPanel({
    restaurant,
    enterpriseDetails,
    enterpriseFailed,
    onToggleWant,
    onShowHours,
}: Readonly<{
    restaurant: Restaurant
    enterpriseDetails: EnterpriseDetails | undefined
    enterpriseFailed: boolean
    onToggleWant: () => void
    onShowHours: () => void
}>) {
    const googlePlaceId = restaurant.address.google?.placeId
    return (
        <div className="min-w-0 lg:col-span-2">
            <RestaurantHeader
                name={restaurant.name}
                link={restaurant.link}
                ownerName={restaurant.ownerName}
                wantCount={restaurant.wantCount}
                location={restaurant.address.label}
                hasLocation={googlePlaceId !== undefined && googlePlaceId !== ""}
            />
            <div className="flex flex-wrap items-center gap-3 px-5 pb-2 md:px-4">
                <RestaurantInterestButton
                    wanted={restaurant.mySave === "want"}
                    wantCount={restaurant.wantCount}
                    onToggleWant={onToggleWant}
                />
                {googlePlaceId !== undefined && googlePlaceId !== "" && (
                    <Button tone="secondary" onClick={onShowHours}>
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
                        <p className="text-body mt-1 leading-relaxed text-pretty text-foreground">{restaurant.note}</p>
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
    )
}

function DetailHero({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
    const navigate = useNavigate()
    const auth = useAuth()
    const viewer = useViewer()
    const toggleWant = useToggleWant(restaurant._id, restaurant.mySave)
    const { enterpriseDetails, openingHours, enterpriseFailed, closedLabel, showHours, setShowHours } =
        useDetailEnterprise(restaurant)

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
                    <RestaurantGallery
                        photos={restaurant.photos}
                        name={restaurant.name}
                        cuisine={restaurant.cuisine}
                        placeId={restaurant._id}
                        viewerId={viewer.kind === "signed-in" ? toId<"profiles">(viewer.id) : undefined}
                        ownerId={restaurant.ownerId}
                    />
                </div>
                <DetailInfoPanel
                    restaurant={restaurant}
                    enterpriseDetails={enterpriseDetails}
                    enterpriseFailed={enterpriseFailed}
                    onToggleWant={handleToggleWant}
                    onShowHours={handleShowHours}
                />
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

function DetailMapSection({
    placeId,
    googlePlaceId,
    name,
    addressLabel,
}: Readonly<{
    placeId: Restaurant["_id"]
    googlePlaceId: string | undefined
    name: string
    addressLabel: string
}>) {
    if (googlePlaceId === undefined || googlePlaceId === "") {
        return null
    }
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <h2 className="font-display text-lg font-semibold text-balance text-foreground">Location</h2>
            <p className="mt-1 text-sm text-muted-foreground">{addressLabel}</p>
            <MapOnVisible placeId={placeId} googlePlaceId={googlePlaceId} name={name} />
        </div>
    )
}

function MapOnVisible({
    placeId,
    googlePlaceId,
    name,
}: Readonly<{ placeId: Restaurant["_id"]; googlePlaceId: string; name: string }>) {
    // The embedded map bills a Dynamic Maps load on mount, so it mounts only
    // once the section nears the viewport instead of with the page.
    const [sentinelRef, isVisible] = useVisible()
    return (
        <div ref={sentinelRef} className="pt-2">
            {isVisible ? (
                <Suspense fallback={<div className="aspect-video rounded-xl bg-surface-muted" aria-hidden="true" />}>
                    <RestaurantCardMap placeId={placeId} googlePlaceId={googlePlaceId} name={name} />
                </Suspense>
            ) : (
                <div className="aspect-video rounded-xl bg-surface-muted" aria-hidden="true" />
            )}
        </div>
    )
}

function DetailBreadcrumb({ name }: Readonly<{ name: string }>) {
    return (
        <div className="border-b border-border py-4">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link to="/" />}>Restaurants</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="min-w-0 flex-1">
                        <BreadcrumbPage>{name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        </div>
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
            <DetailBreadcrumb name={restaurant.name} />
            <div className="mx-auto max-w-3xl space-y-6 pt-4 lg:max-w-5xl">
                <DetailHero key={restaurant._id} restaurant={restaurant} />
                <DetailMapSection
                    placeId={restaurant._id}
                    googlePlaceId={restaurant.address.google?.placeId}
                    name={restaurant.name}
                    addressLabel={restaurant.address.label}
                />
            </div>
        </PageContainer>
    )
}
