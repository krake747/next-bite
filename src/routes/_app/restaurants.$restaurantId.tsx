import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { createContext, lazy, Suspense, use } from "react"

import { warmQueriesWithin } from "@api/convex.options"
import { toId } from "@api/data.model"
import { useViewer } from "@core/identity"
import { restaurantDetailWarmups, restaurantOptions, type Restaurant } from "@core/restaurants"
import { useToggleBeen, useToggleWant } from "@core/saves"
import { useAuth } from "@core/session"
import { GoogleDetailsSection } from "@features/restaurants/google-details-section"
import { type GoogleDetails } from "@features/restaurants/google-details-utils"
import { OpeningHoursDialog } from "@features/restaurants/opening-hours-dialog"
import { RestaurantGallery } from "@features/restaurants/restaurant-gallery"
import { RestaurantHeader } from "@features/restaurants/restaurant-header"
import { RestaurantInterestButton } from "@features/restaurants/restaurant-interest-button"
import { useGoogleDetails } from "@features/restaurants/use-google-details"
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
        await warmQueriesWithin(context.queryClient, restaurantDetailWarmups(restaurantId), LOADER_WARM_BUDGET_MS)
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

type DetailContextValue = {
    readonly restaurant: Restaurant
    readonly details: GoogleDetails | undefined
    readonly detailsFailed: boolean
    readonly openingHours: GoogleDetails["openingHours"]
    readonly closedLabel: string | undefined
    readonly showHours: boolean
    readonly onToggleWant: () => void
    readonly onToggleBeen: () => void
    readonly onShowHours: () => void
    readonly onOpenChange: (open: boolean) => void
}

const DetailContext = createContext<DetailContextValue | null>(null)

function useDetail(): DetailContextValue {
    const value = use(DetailContext)
    if (!value) {
        throw new Error("Detail components must render inside a detail provider")
    }
    return value
}

function DetailInfoPanel() {
    const { restaurant, details, detailsFailed, onToggleWant, onToggleBeen, onShowHours } = useDetail()
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
                    tried={restaurant.mySave === "been"}
                    wantCount={restaurant.wantCount}
                    onToggleWant={onToggleWant}
                    onToggleBeen={onToggleBeen}
                />
                {googlePlaceId !== undefined && googlePlaceId !== "" && (
                    <Button tone="secondary" onClick={onShowHours}>
                        Hours
                    </Button>
                )}
            </div>
            <div className="space-y-3 p-5 md:p-4">
                <GoogleDetailsSection details={details} />
                {restaurant.note !== undefined && restaurant.note !== "" && (
                    <div>
                        <h2 className="font-display text-lg font-semibold text-balance text-foreground">
                            Why it&apos;s recommended
                        </h2>
                        <p className="text-body mt-1 leading-relaxed text-pretty text-foreground">{restaurant.note}</p>
                    </div>
                )}
                <SocialMetadata ownerName={restaurant.ownerName} wantCount={restaurant.wantCount} />
                {detailsFailed && (
                    <p role="alert" className="text-sm text-destructive">
                        Could not load opening hours.
                    </p>
                )}
            </div>
        </div>
    )
}

function DetailClosedBanner() {
    const { closedLabel } = useDetail()
    if (closedLabel === undefined) {
        return null
    }
    return (
        <p
            role="status"
            className="flex items-center gap-2 border-b border-border bg-tomato-50 px-5 py-2.5 text-sm font-medium text-foreground md:px-4"
        >
            <span className="size-1.5 rounded-full bg-tomato-500" aria-hidden="true" />
            {closedLabel}
        </p>
    )
}

function DetailGalleryPane() {
    const { restaurant } = useDetail()
    const viewer = useViewer()
    return (
        <div className="lg:col-span-3">
            <RestaurantGallery
                restaurant={restaurant}
                viewerId={viewer.kind === "signed-in" ? toId<"profiles">(viewer.id) : undefined}
            />
        </div>
    )
}

function DetailHoursDialog() {
    const { restaurant, openingHours, detailsFailed, showHours, onOpenChange } = useDetail()
    return (
        <OpeningHoursDialog
            show={showHours}
            onOpenChange={onOpenChange}
            openingHours={openingHours}
            failed={detailsFailed}
            restaurantName={restaurant.name}
        />
    )
}

function DetailProvider({ restaurant, children }: Readonly<{ restaurant: Restaurant; children: React.ReactNode }>) {
    const navigate = useNavigate()
    const auth = useAuth()
    const toggleWant = useToggleWant(restaurant._id, restaurant.mySave)
    const toggleBeen = useToggleBeen(restaurant._id, restaurant.mySave)
    const { details, openingHours, detailsFailed, closedLabel, showHours, setShowHours } = useGoogleDetails(restaurant)

    const goToLogin = (): void => {
        void navigate({ to: "/login" })
    }

    const handleToggleWant = (): void => {
        if (!auth.isAuthenticated) {
            goToLogin()
            return
        }
        toggleWant()
    }

    const handleToggleBeen = (): void => {
        if (!auth.isAuthenticated) {
            goToLogin()
            return
        }
        toggleBeen()
    }

    const handleShowHours = (): void => {
        setShowHours(true)
    }

    const handleOpenChange = (open: boolean): void => {
        setShowHours(open)
    }

    return (
        <DetailContext
            value={{
                restaurant,
                details,
                detailsFailed,
                openingHours,
                closedLabel,
                showHours,
                onToggleWant: handleToggleWant,
                onToggleBeen: handleToggleBeen,
                onShowHours: handleShowHours,
                onOpenChange: handleOpenChange,
            }}
        >
            {children}
        </DetailContext>
    )
}

function DetailHero() {
    return (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <DetailClosedBanner />
            <div className="grid divide-border lg:grid-cols-5 lg:divide-x">
                <DetailGalleryPane />
                <DetailInfoPanel />
            </div>
            <DetailHoursDialog />
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

function DetailMapSection() {
    const { restaurant } = useDetail()
    const googlePlaceId = restaurant.address.google?.placeId
    // The embedded map bills a Dynamic Maps load on mount, so it mounts only
    // once the section nears the viewport instead of with the page.
    const [sentinelRef, isVisible] = useVisible()
    if (googlePlaceId === undefined || googlePlaceId === "") {
        return null
    }
    return (
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
            <h2 className="font-display text-lg font-semibold text-balance text-foreground">Location</h2>
            <p className="mt-1 text-sm text-muted-foreground">{restaurant.address.label}</p>
            <div ref={sentinelRef} className="pt-2">
                {isVisible ? (
                    <Suspense
                        fallback={<div className="aspect-video rounded-xl bg-surface-muted" aria-hidden="true" />}
                    >
                        <RestaurantCardMap
                            restaurantId={restaurant._id}
                            googlePlaceId={googlePlaceId}
                            name={restaurant.name}
                        />
                    </Suspense>
                ) : (
                    <div className="aspect-video rounded-xl bg-surface-muted" aria-hidden="true" />
                )}
            </div>
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
    const { data: restaurant } = useSuspenseQuery(restaurantOptions(restaurantConvexId))

    if (restaurant === null) {
        return <DetailNotFound />
    }

    return (
        <PageContainer>
            <DetailBreadcrumb name={restaurant.name} />
            <div className="mx-auto max-w-3xl space-y-6 pt-4 lg:max-w-5xl">
                <DetailProvider key={restaurant._id} restaurant={restaurant}>
                    <DetailHero />
                    <DetailMapSection />
                </DetailProvider>
            </div>
        </PageContainer>
    )
}
