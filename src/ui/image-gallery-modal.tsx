import { createSignal, Show, For, createEffect } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { cx } from "./variants"
import { Button } from "./button"
import { LazyImage } from "./lazy-image"
import X from "lucide-solid/icons/x"
import ChevronLeft from "lucide-solid/icons/chevron-left"
import ChevronRight from "lucide-solid/icons/chevron-right"

type ImageGalleryModalProps = {
    images: string[]
    show: boolean
    onOpenChange: (open: boolean) => void
    initialIndex?: number
}

export function ImageGalleryModal(props: ImageGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = createSignal(props.initialIndex ?? 0)
    const [lightboxOpen, setLightboxOpen] = createSignal(false)

    // Update currentIndex when initialIndex prop changes
    createEffect(() => {
        setCurrentIndex(props.initialIndex ?? 0)
    })

    const currentImage = () => props.images[currentIndex()]

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? props.images.length - 1 : prev - 1))
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev === props.images.length - 1 ? 0 : prev + 1))
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") handlePrevious()
        if (e.key === "ArrowRight") handleNext()
        if (e.key === "Escape") {
            if (lightboxOpen()) {
                setLightboxOpen(false)
            } else {
                props.onOpenChange(false)
            }
        }
    }

    return (
        <Dialog open={props.show} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay class="fixed inset-0 z-50 bg-black/90">
                    <Dialog.Content
                        class="fixed inset-0 flex flex-col outline-none"
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                    >
                        <div class="flex items-center justify-between p-4">
                            <Dialog.Title class="text-lg font-semibold text-white">
                                Image Gallery ({currentIndex() + 1}/{props.images.length})
                            </Dialog.Title>
                            <button
                                type="button"
                                onClick={() => props.onOpenChange(false)}
                                class="rounded-full p-2 text-white hover:bg-white/20"
                                aria-label="Close gallery"
                            >
                                <X class="size-6" />
                            </button>
                        </div>

                        <Show
                            when={lightboxOpen()}
                            fallback={
                                <div class="flex-1 overflow-y-auto p-4">
                                    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                                        <For each={props.images}>
                                            {(imageUrl, index) => (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCurrentIndex(index())
                                                        setLightboxOpen(true)
                                                    }}
                                                    class="group relative aspect-square overflow-hidden rounded-lg"
                                                >
                                                    <LazyImage
                                                        src={imageUrl}
                                                        alt={`Image ${index() + 1}`}
                                                        aspectRatio="1"
                                                        class="transition-transform duration-200 ease-out group-hover:scale-105"
                                                    />
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            }
                        >
                            <div class="flex flex-1 items-center justify-center p-4">
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    class={cx(
                                        "absolute left-4 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors duration-150 ease hover:bg-white/30",
                                        props.images.length <= 1 && "hidden",
                                    )}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft class="size-6" />
                                </button>

                                <div class="relative max-h-full max-w-full">
                                    <Show when={currentImage()}>
                                        {(imageSrc) => (
                                            <LazyImage
                                                src={imageSrc()}
                                                alt={`Image ${currentIndex() + 1}`}
                                                class="max-h-[80vh] max-w-full object-contain"
                                                loading="eager"
                                            />
                                        )}
                                    </Show>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNext}
                                    class={cx(
                                        "absolute right-4 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors duration-150 ease hover:bg-white/30",
                                        props.images.length <= 1 && "hidden",
                                    )}
                                    aria-label="Next image"
                                >
                                    <ChevronRight class="size-6" />
                                </button>
                            </div>

                            <div class="p-4 text-center">
                                <Button variant="secondary" size="md" onClick={() => setLightboxOpen(false)}>
                                    Back to Grid
                                </Button>
                            </div>
                        </Show>
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog>
    )
}
