import { LazyImage } from "@pattern/lazy-image"
import { cx } from "@ui/cva.config"

export function GalleryGrid({
    images,
    onSelect,
    className,
}: Readonly<{
    images: ReadonlyArray<string>
    onSelect: (index: number) => void
    className?: string | undefined
}>) {
    return (
        <div data-slot="gallery-grid" className={cx("flex-1 overflow-y-auto p-4", className)}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((imageUrl, index) => (
                    <button
                        key={imageUrl}
                        type="button"
                        onClick={() => {
                            onSelect(index)
                        }}
                        aria-label={`Open image ${index + 1}`}
                        className="group relative aspect-square overflow-hidden rounded-lg"
                    >
                        <LazyImage
                            src={imageUrl}
                            alt={`Image ${index + 1}`}
                            aspectRatio="1"
                            className="transition-transform duration-200 ease-out-quad group-hover:scale-105"
                        />
                    </button>
                ))}
            </div>
        </div>
    )
}
