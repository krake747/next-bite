export type GalleryPhoto = {
    readonly url: string
    readonly author?: string | undefined
}

export function photoUrls(photos: ReadonlyArray<GalleryPhoto>): string[] {
    return photos.map((photo) => photo.url)
}
