import { XIcon } from "@phosphor-icons/react"

import { LazyImage } from "@pattern/lazy-image"
import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

import { keysForPhotoUrls } from "./photos"

export function GalleryGrid({
    images,
    onSelect,
    removableIndexes,
    onRemoveAt,
    className,
}: Readonly<{
    images: ReadonlyArray<string>
    onSelect: (index: number) => void
    removableIndexes?: ReadonlySet<number> | undefined
    onRemoveAt?: ((index: number) => void) | undefined
    className?: string | undefined
}>) {
    const keys = keysForPhotoUrls(images)
    return (
        <div data-slot="gallery-grid" className={cx("flex-1 overflow-y-auto p-4", className)}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {images.map((imageUrl, index) => (
                    <div key={keys[index] ?? imageUrl} className="relative aspect-square">
                        <button
                            type="button"
                            onClick={() => {
                                onSelect(index)
                            }}
                            aria-label={`Open image ${index + 1}`}
                            className="group relative aspect-square w-full overflow-hidden rounded-lg focus-visible:outline-ring"
                        >
                            <LazyImage src={imageUrl} alt={`Image ${index + 1}`} ratio={1 / 1} />
                        </button>
                        {removableIndexes?.has(index) === true && onRemoveAt !== undefined && (
                            <IconButton
                                label={`Remove image ${index + 1}`}
                                tone="destructive"
                                size="xs"
                                onClick={() => {
                                    onRemoveAt(index)
                                }}
                                className="absolute top-1 right-1"
                            >
                                <XIcon className="size-3" aria-hidden="true" />
                            </IconButton>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
