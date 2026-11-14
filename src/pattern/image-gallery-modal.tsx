import { XIcon } from "@phosphor-icons/react"

import { Dialog, DialogContent, DialogTitle } from "@ui/dialog"

import { GalleryGrid } from "./gallery/gallery-grid"
import { GalleryViewer, useGalleryViewer } from "./gallery/gallery-viewer"
import { LightboxView } from "./gallery/lightbox-view"

type ImageGalleryModalProps = {
    images: ReadonlyArray<string>
    show: boolean
    onOpenChange: (open: boolean) => void
    initialIndex?: number | undefined
    removableIndexes?: ReadonlySet<number> | undefined
    onRemoveAt?: ((index: number) => void) | undefined
    removeError?: string | null | undefined
}

export function ImageGalleryModal({
    images,
    show,
    onOpenChange,
    initialIndex,
    removableIndexes,
    onRemoveAt,
    removeError,
}: Readonly<ImageGalleryModalProps>) {
    if (images.length === 0) {
        return null
    }
    // Remount on open state or target index so the viewer starts at initialIndex without a sync effect.
    const viewerKey = show ? `open-${initialIndex ?? 0}` : "closed"
    return (
        <Dialog open={show} onOpenChange={onOpenChange}>
            <GalleryViewer key={viewerKey} images={images} initialIndex={initialIndex}>
                <GalleryShell
                    onClose={() => {
                        onOpenChange(false)
                    }}
                    removableIndexes={removableIndexes}
                    onRemoveAt={onRemoveAt}
                    removeError={removeError}
                />
            </GalleryViewer>
        </Dialog>
    )
}

function GalleryShell({
    onClose,
    removableIndexes,
    onRemoveAt,
    removeError,
}: Readonly<{
    onClose: () => void
    removableIndexes?: ReadonlySet<number> | undefined
    onRemoveAt?: ((index: number) => void) | undefined
    removeError?: string | null | undefined
}>) {
    const viewer = useGalleryViewer()

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
            viewer.showPrevious()
        }
        if (e.key === "ArrowRight") {
            viewer.showNext()
        }
        if (e.key === "Escape") {
            if (viewer.mode === "lightbox") {
                viewer.backToGrid()
            } else {
                onClose()
            }
        }
    }

    return (
        <DialogContent
            size="full"
            padding="none"
            variant="fullscreen"
            tone="darkest"
            showCloseButton={false}
            ref={viewer.contentRef}
            className="flex flex-col"
            onKeyDown={handleKeyDown}
            tabIndex={0}
        >
            <div className="flex items-center justify-between p-4">
                <DialogTitle tone="inverse">
                    Image Gallery ({viewer.currentIndex + 1}/{viewer.images.length})
                </DialogTitle>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 text-inverse hover:bg-surface/20"
                    aria-label="Close gallery"
                >
                    <XIcon className="size-6" />
                </button>
            </div>

            {viewer.mode === "grid" ? (
                <>
                    {removeError !== undefined && removeError !== null && removeError !== "" && (
                        <p role="alert" className="px-4 pt-2 text-sm text-destructive">
                            {removeError}
                        </p>
                    )}
                    <GalleryGrid
                        images={viewer.images}
                        onSelect={viewer.openLightbox}
                        removableIndexes={removableIndexes}
                        onRemoveAt={onRemoveAt}
                    />
                </>
            ) : (
                <LightboxView />
            )}
        </DialogContent>
    )
}
