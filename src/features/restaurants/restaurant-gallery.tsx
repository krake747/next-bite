import Images from "lucide-react/icons/images"
import Utensils from "lucide-react/icons/utensils"

import { Lightbox, useLightbox } from "@pattern/gallery/lightbox"
import { type GalleryPhoto } from "@pattern/gallery/photos"
import { LazyImage } from "@pattern/lazy-image"
import { Badge } from "@ui/badge"

export function RestaurantGallery({
    photos,
    name,
    cuisine,
    actions,
}: Readonly<{
    photos: ReadonlyArray<GalleryPhoto>
    name: string
    cuisine: string
    actions?: React.ReactNode | undefined
}>) {
    const lightbox = useLightbox(photos)
    const cover = photos[0]?.url
    const hasImages = photos.length > 0

    return (
        <>
            <div className="relative aspect-2/1 w-full overflow-hidden">
                {hasImages ? (
                    <>
                        <LazyImage src={cover} alt={`${name} - main image`} aspectRatio="2/1" />
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                    </>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-stone-200 to-stone-300">
                        <div className="flex items-center gap-2">
                            <Utensils className="size-5 text-stone-400" />
                            <span className="font-sans text-xs tracking-wide text-muted-foreground uppercase">
                                {cuisine}
                            </span>
                        </div>
                    </div>
                )}

                <div className="absolute top-3 left-3">
                    <Badge tone="brand">
                        <Utensils className="mr-1 size-3" />
                        {cuisine}
                    </Badge>
                </div>

                {actions !== undefined && <div className="absolute top-3 right-3 flex gap-1.5">{actions}</div>}

                {hasImages && (
                    <div className="absolute right-3 bottom-3">
                        <button
                            type="button"
                            onClick={() => {
                                lightbox.openAt(0)
                            }}
                            className="flex items-center gap-1.5 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-surface"
                        >
                            <Images className="size-3.5" />
                            {photos.length > 1 ? <span>{photos.length} photos</span> : <span>View</span>}
                        </button>
                    </div>
                )}
            </div>
            <Lightbox lightbox={lightbox} />
        </>
    )
}
