import { useState } from "react"

import { ImageGalleryModal } from "@pattern/image-gallery-modal"

import { photoUrls, type GalleryPhoto } from "./photos"

type LightboxSelection = { readonly kind: "closed" } | { readonly kind: "open"; readonly index: number }

export function useLightbox(photos: ReadonlyArray<GalleryPhoto>) {
    const [selection, setSelection] = useState<LightboxSelection>({ kind: "closed" })
    return {
        urls: photoUrls(photos),
        selection,
        openAt: (index: number) => {
            setSelection({ kind: "open", index })
        },
        close: () => {
            setSelection({ kind: "closed" })
        },
    }
}

type LightboxState = ReturnType<typeof useLightbox>

export function Lightbox({
    lightbox,
    removableIndexes,
    onRemoveAt,
    removeError,
}: Readonly<{
    lightbox: LightboxState
    removableIndexes?: ReadonlySet<number> | undefined
    onRemoveAt?: ((index: number) => void) | undefined
    removeError?: string | null | undefined
}>) {
    if (lightbox.selection.kind === "closed") {
        return null
    }
    return (
        <ImageGalleryModal
            images={lightbox.urls}
            show
            initialIndex={lightbox.selection.index}
            onOpenChange={(open) => {
                if (!open) {
                    lightbox.close()
                }
            }}
            removableIndexes={removableIndexes}
            onRemoveAt={onRemoveAt}
            removeError={removeError}
        />
    )
}
