export type MapViewport = {
    readonly low: { readonly lat: number; readonly lng: number }
    readonly high: { readonly lat: number; readonly lng: number }
}

export type MapBounds = {
    readonly south: number
    readonly west: number
    readonly north: number
    readonly east: number
}

export function boundsForViewport(viewport: MapViewport | undefined): MapBounds | undefined {
    if (viewport === undefined) {
        return undefined
    }
    return {
        south: viewport.low.lat,
        west: viewport.low.lng,
        north: viewport.high.lat,
        east: viewport.high.lng,
    }
}
