import X from "lucide-react/icons/x"
import { useEffect } from "react"

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@ui/dialog"

import { GalleryGrid } from "./gallery/gallery-grid"
import { GalleryViewer, useGalleryViewer } from "./gallery/gallery-viewer"
import { LightboxView } from "./gallery/lightbox-view"

type ImageGalleryModalProps = {
    images: ReadonlyArray<string>
    show: boolean
    onOpenChange: (open: boolean) => void
    initialIndex?: number | undefined
}

export function ImageGalleryModal({ images, show, onOpenChange, initialIndex }: Readonly<ImageGalleryModalProps>) {
    if (images.length === 0) {
        return null
    }
    return (
        <Dialog show={show} onOpenChange={onOpenChange}>
            <GalleryViewer images={images} initialIndex={initialIndex}>
                <GalleryShell
                    show={show}
                    initialIndex={initialIndex}
                    onClose={() => {
                        onOpenChange(false)
                    }}
                />
            </GalleryViewer>
        </Dialog>
    )
}

function GalleryShell({
    show,
    initialIndex,
    onClose,
}: Readonly<{
    show: boolean
    initialIndex: number | undefined
    onClose: () => void
}>) {
    const viewer = useGalleryViewer()

    useEffect(() => {
        if (show) {
            viewer.select(initialIndex ?? 0)
        }
    }, [show, initialIndex, viewer])

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
        <DialogBackdrop variant="fullscreen" tone="dark">
            <DialogPanel
                size="full"
                padding="none"
                ref={viewer.contentRef}
                className="fixed inset-0 flex flex-col"
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
                        className="rounded-full p-2 text-white hover:bg-surface/20"
                        aria-label="Close gallery"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                {viewer.mode === "grid" ? (
                    <GalleryGrid images={viewer.images} onSelect={viewer.openLightbox} />
                ) : (
                    <LightboxView />
                )}
            </DialogPanel>
        </DialogBackdrop>
    )
}
