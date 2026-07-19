import { LazyImage } from "@pattern/lazy-image"

export function GalleryGrid({ images, onSelect }: { images: string[]; onSelect: (index: number) => void }) {
    return (
        <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((imageUrl, index) => (
                    <button
                        key={imageUrl}
                        type="button"
                        onClick={() => onSelect(index)}
                        className="group relative aspect-square overflow-hidden rounded-lg"
                    >
                        <LazyImage
                            src={imageUrl}
                            alt={`Image ${index + 1}`}
                            aspectRatio="1"
                            className="transition-transform duration-200 ease-out group-hover:scale-105"
                        />
                    </button>
                ))}
            </div>
        </div>
    )
}
