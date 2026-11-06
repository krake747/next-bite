import { Lightbox, useLightbox } from "@pattern/gallery/lightbox"
import { type GalleryPhoto } from "@pattern/gallery/photos"
import { LazyImage } from "@pattern/lazy-image"

export function PhotoGallery({
    photos,
}: Readonly<{
    photos: ReadonlyArray<GalleryPhoto>
}>) {
    const lightbox = useLightbox(photos)

    if (photos.length === 0) {
        return null
    }

    return (
        <div>
            <div className="grid grid-cols-3 gap-2">
                {photos.slice(0, 3).map((photo, index) => (
                    <button
                        key={photo.url}
                        type="button"
                        onClick={() => {
                            lightbox.openAt(index)
                        }}
                        className="group relative aspect-square overflow-hidden rounded-lg"
                        aria-label={`Open photo ${index + 1}${photo.author ? ` by ${photo.author}` : ""}`}
                    >
                        <LazyImage
                            src={photo.url}
                            alt={photo.author ? `Photo by ${photo.author}` : `Photo ${index + 1}`}
                            aspectRatio="1"
                            className="transition-transform duration-200 ease-out-quad group-hover:scale-105"
                        />
                        {photo.author !== undefined && photo.author !== "" && (
                            <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
                                {photo.author}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {photos.length > 3 && (
                <button
                    type="button"
                    onClick={() => {
                        lightbox.openAt(3)
                    }}
                    className="mt-2 cursor-pointer text-sm font-medium text-tomato-700 hover:text-tomato-600"
                >
                    View all {photos.length} photos
                </button>
            )}
            <Lightbox lightbox={lightbox} />
        </div>
    )
}
