import { AdvancedMarker, Map } from "@vis.gl/react-google-maps"
import { Suspense, useEffect, useRef, useState } from "react"

import { type Id } from "@api/data.model"
import { usePlaceLocation } from "@core/restaurants"

import { boundsForViewport, type MapViewport } from "./map-bounds"

type MapLocation = Readonly<{
    readonly lat: number
    readonly lng: number
    readonly viewport?: MapViewport | undefined
}>

type LocationState =
    | { readonly kind: "idle" }
    | { readonly kind: "loading" }
    | { readonly kind: "ready"; readonly location: MapLocation }
    | { readonly kind: "missing" }

const LOCATION_TIMEOUT_MS = 15_000

function RestaurantCardMapView({
    location,
    name,
}: Readonly<{
    location: MapLocation
    name: string | undefined
}>) {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`
    const bounds = boundsForViewport(location.viewport)
    return (
        <div>
            <div className="mt-2 aspect-video w-full overflow-hidden rounded-xl border border-border shadow-inner">
                <Map
                    mapId="DEMO_MAP_ID"
                    disableDefaultUI
                    zoomControl={false}
                    mapTypeControl={false}
                    streetViewControl={false}
                    fullscreenControl={false}
                    scrollwheel={false}
                    style={{ width: "100%", height: "100%" }}
                    {...(bounds === undefined ? { center: location, zoom: 15 } : { defaultBounds: bounds })}
                >
                    <AdvancedMarker position={location} title={name ?? null} />
                </Map>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
                <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline decoration-border-strong underline-offset-2 transition-colors duration-150 hover:text-primary"
                >
                    Get directions
                </a>
            </p>
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
    const [locationState, setLocationState] = useState<LocationState>({ kind: "idle" })
    const [retryNonce, setRetryNonce] = useState(0)
    const requestRef = useRef(0)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (googlePlaceId === "") {
            setLocationState({ kind: "missing" })
            return () => {}
        }
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current)
        }
        const requestId = requestRef.current + 1
        requestRef.current = requestId
        setLocationState({ kind: "loading" })
        timeoutRef.current = setTimeout(() => {
            if (requestRef.current === requestId) {
                console.error("[RestaurantCardMap] location lookup timed out", { placeId })
                setLocationState({ kind: "missing" })
            }
        }, LOCATION_TIMEOUT_MS)
        void fetchLocation({ placeId })
            .then((location) => {
                if (requestRef.current !== requestId) {
                    return
                }
                if (timeoutRef.current !== null) {
                    clearTimeout(timeoutRef.current)
                }
                setLocationState(location === null ? { kind: "missing" } : { kind: "ready", location })
            })
            .catch((error: unknown) => {
                if (requestRef.current !== requestId) {
                    return
                }
                if (timeoutRef.current !== null) {
                    clearTimeout(timeoutRef.current)
                }
                console.error("[RestaurantCardMap] location lookup failed", { placeId, error })
                setLocationState({ kind: "missing" })
            })
        return () => {
            requestRef.current += 1
            if (timeoutRef.current !== null) {
                clearTimeout(timeoutRef.current)
            }
        }
        // Fetch once per place id; manual retry bumps retryNonce.
    }, [fetchLocation, placeId, googlePlaceId, retryNonce])

    return (
        <div className="w-full">
            <Suspense
                fallback={<div className="mt-2 aspect-video w-full rounded-xl bg-surface-muted" aria-hidden="true" />}
            >
                {locationState.kind === "ready" ? (
                    <RestaurantCardMapView location={locationState.location} name={name} />
                ) : locationState.kind === "missing" ? (
                    <div className="mt-2 flex flex-col items-center gap-1">
                        <p className="text-center text-xs text-muted-foreground">Map unavailable</p>
                        <button
                            type="button"
                            onClick={() => {
                                setRetryNonce((nonce) => nonce + 1)
                            }}
                            className="rounded-sm text-xs font-medium text-muted-foreground underline decoration-border-strong underline-offset-2 transition-colors duration-150 hover:text-primary"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="mt-2 aspect-video w-full rounded-xl bg-surface-muted" aria-hidden="true" />
                )}
            </Suspense>
        </div>
    )
}
