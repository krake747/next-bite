import { useState } from "react"

import { ImageGalleryModal } from "@pattern/image-gallery-modal"

import { photoUrls, type GalleryPhoto } from "./photos"

export function useLightbox(photos: ReadonlyArray<GalleryPhoto>) {
    const [openedIndex, setOpenedIndex] = useState<number | null>(null)
    return {
        urls: photoUrls(photos),
        openedIndex,
        openAt: (index: number) => {
            setOpenedIndex(index)
        },
        close: () => {
            setOpenedIndex(null)
        },
    }
}

type LightboxState = ReturnType<typeof useLightbox>

export function Lightbox({ lightbox }: Readonly<{ lightbox: LightboxState }>) {
    if (lightbox.openedIndex === null) {
        return null
    }
    return (
        <ImageGalleryModal
            images={lightbox.urls}
            show
            initialIndex={lightbox.openedIndex}
            onOpenChange={(open) => {
                if (!open) {
                    lightbox.close()
                }
            }}
        />
    )
}
