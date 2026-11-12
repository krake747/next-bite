export type GalleryPhoto = {
    readonly url: string
}

export function photoUrls(photos: ReadonlyArray<GalleryPhoto>): string[] {
    return photos.map((photo) => photo.url)
}

export function keysForPhotoUrls(urls: ReadonlyArray<string>): string[] {
    const seen = new Map<string, number>()
    return urls.map((url) => {
        const occurrence = seen.get(url) ?? 0
        seen.set(url, occurrence + 1)
        return occurrence === 0 ? url : `${url}__${occurrence}`
    })
}
