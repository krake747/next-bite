export type GalleryPhoto = {
    readonly url: string
    readonly author?: string | undefined
}

export function photoUrls(photos: ReadonlyArray<GalleryPhoto>): string[] {
    return photos.map((photo) => photo.url)
}

export function keyForPhotoUrl(seen: Map<string, number>, url: string): string {
    const occurrence = seen.get(url) ?? 0
    seen.set(url, occurrence + 1)
    return occurrence === 0 ? url : `${url}__${occurrence}`
}
