import { AdvancedMarker, Map } from "@vis.gl/react-google-maps"

export function RestaurantCardMapView({
    location,
    name,
}: Readonly<{
    location: Readonly<{ readonly lat: number; readonly lng: number }>
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
