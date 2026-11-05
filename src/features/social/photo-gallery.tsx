import Camera from "lucide-react/icons/camera"
import { useState } from "react"

import { ImageGalleryModal } from "@pattern/image-gallery-modal"
import { LazyImage } from "@pattern/lazy-image"

export type GalleryPhoto = {
    readonly url: string
    readonly author?: string | undefined
}

export function PhotoGallery({
    photos,
    onAddPhoto,
}: Readonly<{
    photos: ReadonlyArray<GalleryPhoto>
    onAddPhoto?: (() => void) | undefined
}>) {
    const [viewerIndex, setViewerIndex] = useState<number | null>(null)
    const urls = photos.map((photo) => photo.url)

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
                            setViewerIndex(index)
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
                        setViewerIndex(3)
                    }}
                    className="mt-2 cursor-pointer text-sm font-medium text-tomato-700 hover:text-tomato-600"
                >
                    View all {photos.length} photos
                </button>
            )}
            {onAddPhoto !== undefined && (
                <button
                    type="button"
                    onClick={onAddPhoto}
                    className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-tomato-700 hover:text-tomato-600"
                >
                    <Camera className="size-4" aria-hidden="true" />
                    Add your photo
                </button>
            )}
            {viewerIndex !== null && (
                <ImageGalleryModal
                    images={urls}
                    show
                    initialIndex={viewerIndex}
                    onOpenChange={(open) => {
                        if (!open) {
                            setViewerIndex(null)
                        }
                    }}
                />
            )}
        </div>
    )
}
