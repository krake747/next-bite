import { CameraPlusIcon, ForkKnifeIcon } from "@phosphor-icons/react"
import { useEffect, useState } from "react"

import { type Id } from "@api/data.model"
import { MAX_IMAGES } from "@core/constants"
import { type GalleryPhoto } from "@pattern/gallery"
import { LazyImage } from "@pattern/lazy-image"
import { AspectRatio } from "@ui/aspect-ratio"
import { Badge } from "@ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@ui/carousel"
import { type CarouselApi } from "@ui/carousel.context"
import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

import { PlacePhotoUploadDialog } from "./place-photo-upload-dialog"

function useCarouselSelection(): {
    readonly setApi: (api: CarouselApi) => void
    readonly selected: number
    readonly scrollTo: (index: number) => void
} {
    const [api, setApi] = useState<CarouselApi>()
    const [selected, setSelected] = useState(0)

    useEffect(() => {
        if (!api) {
            return () => {}
        }
        const onSelect = () => {
            setSelected(api.selectedScrollSnap())
        }
        onSelect()
        api.on("select", onSelect)
        return () => {
            api.off("select", onSelect)
        }
    }, [api])

    return {
        setApi,
        selected,
        scrollTo: (index: number) => {
            api?.scrollTo(index)
        },
    }
}

function SlideDots({
    count,
    selected,
    onSelect,
}: Readonly<{ count: number; selected: number; onSelect: (index: number) => void }>) {
    if (count <= 1) {
        return null
    }
    return (
        <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
            {Array.from({ length: count }, (_, index) => (
                <button
                    key={index}
                    type="button"
                    tabIndex={-1}
                    aria-label={`Go to slide ${index + 1}`}
                    aria-current={selected === index}
                    onClick={() => {
                        onSelect(index)
                    }}
                    className={cx(
                        "size-2 rounded-full transition-colors duration-150",
                        selected === index ? "bg-inverse" : "bg-inverse/50 hover:bg-inverse/80",
                    )}
                />
            ))}
        </div>
    )
}

function GallerySlides({ photos, name }: Readonly<{ photos: ReadonlyArray<GalleryPhoto>; name: string }>) {
    return (
        <CarouselContent className="h-full">
            {photos.map((photo, index) => (
                <CarouselItem key={photo.url} aria-label={`${name} photo ${index + 1} of ${photos.length}`}>
                    <div className="-mr-4 h-full">
                        <LazyImage
                            src={photo.url}
                            alt={`${name} - image ${index + 1}`}
                            ratio={2 / 1}
                            className="pointer-events-none"
                        />
                    </div>
                </CarouselItem>
            ))}
        </CarouselContent>
    )
}

function GalleryTopOverlays({
    tagline,
    canAdd,
    onAdd,
    actions,
}: Readonly<{
    tagline: string
    canAdd: boolean
    onAdd: () => void
    actions?: React.ReactNode | undefined
}>) {
    return (
        <>
            <div className="absolute top-3 left-3">
                <Badge tone="brand">
                    <ForkKnifeIcon className="mr-1 size-3" />
                    {tagline}
                </Badge>
            </div>
            <div className="absolute top-3 right-3 flex gap-1.5">
                {canAdd && (
                    <IconButton label="Add photos" tone="neutral" size="sm" onClick={onAdd}>
                        <CameraPlusIcon className="size-4" aria-hidden="true" />
                    </IconButton>
                )}
                {actions}
            </div>
        </>
    )
}

export function RestaurantGallery({
    photos,
    name,
    cuisine,
    actions,
    placeId,
    viewerId,
    ownerId,
}: Readonly<{
    photos: ReadonlyArray<GalleryPhoto>
    name: string
    cuisine?: string | undefined
    actions?: React.ReactNode | undefined
    placeId?: Id<"places"> | undefined
    viewerId?: Id<"profiles"> | undefined
    ownerId?: Id<"profiles"> | undefined
}>) {
    const selection = useCarouselSelection()
    const [showUpload, setShowUpload] = useState(false)
    const tagline = cuisine ?? "Saved place"
    const hasImages = photos.length > 0
    const browsable = photos.length > 1
    const canAdd = placeId !== undefined && viewerId !== undefined && photos.length < MAX_IMAGES

    return (
        <>
            <AspectRatio ratio={2 / 1} className="h-full w-full overflow-hidden">
                {hasImages ? (
                    <Carousel setApi={selection.setApi} className="h-full" opts={{ loop: browsable }}>
                        <GallerySlides photos={photos} name={name} />
                        {browsable && (
                            <>
                                <CarouselPrevious tone="inverse" size="sm" className="left-3" />
                                <CarouselNext tone="inverse" size="sm" className="right-3" />
                            </>
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                        <SlideDots count={photos.length} selected={selection.selected} onSelect={selection.scrollTo} />
                    </Carousel>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-surface-muted to-stone-300">
                        <div className="flex items-center gap-2">
                            <ForkKnifeIcon className="size-5 text-muted-foreground" />
                            <span className="font-sans text-xs tracking-wide text-muted-foreground uppercase">
                                {tagline}
                            </span>
                        </div>
                    </div>
                )}

                <GalleryTopOverlays
                    tagline={tagline}
                    canAdd={canAdd}
                    onAdd={() => {
                        setShowUpload(true)
                    }}
                    actions={actions}
                />
            </AspectRatio>
            {placeId !== undefined && (
                <PlacePhotoUploadDialog
                    placeId={placeId}
                    show={showUpload}
                    onOpenChange={setShowUpload}
                    remaining={MAX_IMAGES - photos.length}
                    restaurantName={name}
                    existingPhotos={photos}
                    viewerId={viewerId}
                    ownerId={ownerId}
                />
            )}
        </>
    )
}
