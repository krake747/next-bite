import { LazyImage } from "@pattern/lazy-image"
import { cx } from "@ui/cva.config"

import { keysForPhotoUrls } from "./photos"

export function GalleryGrid({
    images,
    onSelect,
    className,
}: Readonly<{
    images: ReadonlyArray<string>
    onSelect: (index: number) => void
    className?: string | undefined
}>) {
    const keys = keysForPhotoUrls(images)
    return (
        <div data-slot="gallery-grid" className={cx("flex-1 overflow-y-auto p-4", className)}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((imageUrl, index) => (
                    <button
                        key={keys[index] ?? imageUrl}
                        type="button"
                        onClick={() => {
                            onSelect(index)
                        }}
                        aria-label={`Open image ${index + 1}`}
                        className="group relative aspect-square overflow-hidden rounded-lg focus-visible:outline-ring"
                    >
                        <LazyImage src={imageUrl} alt={`Image ${index + 1}`} ratio={1 / 1} />
                    </button>
                ))}
            </div>
        </div>
    )
}
