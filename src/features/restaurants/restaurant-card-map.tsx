import { CaretDownIcon, NavigationArrowIcon } from "@phosphor-icons/react"
import { AdvancedMarker, Map } from "@vis.gl/react-google-maps"
import { Suspense, useEffect, useRef, useState } from "react"

import { type Id } from "@api/data.model"
import { usePlaceLocation } from "@core/restaurants"

type MapLocation = Readonly<{ readonly lat: number; readonly lng: number }>

type LocationState =
    | { readonly kind: "idle" }
    | { readonly kind: "loading" }
    | { readonly kind: "ready"; readonly location: MapLocation }
    | { readonly kind: "missing" }

function RestaurantCardMapView({
    location,
    name,
}: Readonly<{
    location: MapLocation
    name: string | undefined
}>) {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
    return (
        <div>
            <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-border shadow-inner"
                title="Get directions"
            >
                <Map
                    center={location}
                    zoom={15}
                    mapId="DEMO_MAP_ID"
                    disableDefaultUI
                    zoomControl={false}
                    mapTypeControl={false}
                    streetViewControl={false}
                    fullscreenControl={false}
                    scrollwheel={false}
                    style={{ width: "100%", height: "100%" }}
                >
                    <AdvancedMarker position={location} title={name ?? null} />
                </Map>
            </a>
            <p className="mt-2 text-center text-xs text-muted-foreground">Click map to get directions</p>
        </div>
    )
}

export function RestaurantCardMap({
    placeId,
    googlePlaceId,
    name,
}: Readonly<{
    placeId: Id<"places">
    googlePlaceId: string
    name: string | undefined
}>) {
    const fetchLocation = usePlaceLocation()
    const [showMap, setShowMap] = useState(false)
    const [locationState, setLocationState] = useState<LocationState>({ kind: "idle" })
    const requestRef = useRef(0)

    useEffect(() => {
        if (!showMap || locationState.kind !== "idle") {
            return () => {}
        }
        if (googlePlaceId === "") {
            setLocationState({ kind: "missing" })
            return () => {}
        }
        const requestId = requestRef.current + 1
        requestRef.current = requestId
        setLocationState({ kind: "loading" })
        let cancelled = false
        void fetchLocation
            .mutateAsync({ placeId })
            .then((location) => {
                if (cancelled || requestRef.current !== requestId) {
                    return
                }
                setLocationState(location === null ? { kind: "missing" } : { kind: "ready", location })
            })
            .catch(() => {
                if (!cancelled && requestRef.current === requestId) {
                    setLocationState({ kind: "missing" })
                }
            })
        return () => {
            cancelled = true
        }
    }, [showMap, locationState.kind, googlePlaceId, placeId, fetchLocation])

    return (
        <div className="px-5 md:px-4">
            <button
                type="button"
                onClick={() => {
                    setShowMap((visible) => !visible)
                }}
                aria-expanded={showMap}
                className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2.5 text-sm text-muted-foreground hover:border-border hover:bg-surface-muted"
            >
                <div className="flex items-center gap-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-surface-muted">
                        <NavigationArrowIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <span className="font-medium">View on Map</span>
                </div>
                <CaretDownIcon
                    aria-hidden="true"
                    className={`size-4 text-muted-foreground ${showMap ? "rotate-180" : ""}`}
                />
            </button>
            {showMap && (
                <Suspense
                    fallback={
                        <div className="mt-2 aspect-video w-full rounded-xl bg-surface-muted" aria-hidden="true" />
                    }
                >
                    {locationState.kind === "ready" ? (
                        <RestaurantCardMapView location={locationState.location} name={name} />
                    ) : locationState.kind === "missing" ? (
                        <p className="mt-2 text-center text-xs text-muted-foreground">Map unavailable</p>
                    ) : (
                        <div className="mt-2 aspect-video w-full rounded-xl bg-surface-muted" aria-hidden="true" />
                    )}
                </Suspense>
            )}
        </div>
    )
}
