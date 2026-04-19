import { createSignal, Show, For, createEffect, onCleanup } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { cx } from "./variants"
import { Button } from "./button"
import { LazyImage } from "./lazy-image"
import { createPerPointerListeners } from "@solid-primitives/pointer"
import X from "lucide-solid/icons/x"
import ChevronLeft from "lucide-solid/icons/chevron-left"
import ChevronRight from "lucide-solid/icons/chevron-right"
import ZoomIn from "lucide-solid/icons/zoom-in"
import ZoomOut from "lucide-solid/icons/zoom-out"
import Maximize from "lucide-solid/icons/maximize"
import Minimize from "lucide-solid/icons/minimize"
import RotateCcw from "lucide-solid/icons/rotate-ccw"

const ZOOM_STEP = 0.5
const MIN_ZOOM = 0.5
const DEFAULT_ZOOM = 1
const MAX_ZOOM = 4

type ImageGalleryModalProps = {
    images: string[]
    show: boolean
    onOpenChange: (open: boolean) => void
    initialIndex?: number
}

type PanState = { x: number; y: number }

export function ImageGalleryModal(props: ImageGalleryModalProps) {
    const [currentIndex, setCurrentIndex] = createSignal(props.initialIndex ?? 0)
    const [lightboxOpen, setLightboxOpen] = createSignal(false)
    const [zoom, setZoom] = createSignal(1)
    const [pan, setPan] = createSignal<PanState>({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = createSignal(false)
    const [isFullscreen, setIsFullscreen] = createSignal(false)
    const [rotation, setRotation] = createSignal(0)
    let imageContainerRef: HTMLDivElement | undefined // eslint-disable-line no-unassigned-vars

    createEffect(() => {
        setCurrentIndex(props.initialIndex ?? 0)
    })

    createEffect(() => {
        if (imageContainerRef) {
            createPerPointerListeners({
                target: imageContainerRef,
                onDown: eventHandler,
            })
        }
    })

    onCleanup(() => {})

    const resetZoom = () => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
        setRotation(0)
    }

    const handleZoomIn = () => {
        setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM))
    }

    const handleZoomOut = () => {
        setZoom((z) => {
            const newZoom = Math.max(z - ZOOM_STEP, MIN_ZOOM)
            if (newZoom === MIN_ZOOM) {
                setPan({ x: 0, y: 0 })
            }
            return newZoom
        })
    }

    const handleClickZoom = () => {
        if (zoom() > DEFAULT_ZOOM) {
            setZoom(DEFAULT_ZOOM)
            setPan({ x: 0, y: 0 })
            setRotation(0)
        } else {
            setZoom(2)
        }
    }

    const toggleFullscreen = async () => {
        const elem = imageContainerRef?.parentElement
        if (!elem) return

        try {
            if (!document.fullscreenElement) {
                await elem.requestFullscreen()
                setIsFullscreen(true)
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch {}
    }

    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement)
    }

    if (typeof document !== "undefined") {
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        onCleanup(() => document.removeEventListener("fullscreenchange", handleFullscreenChange))
    }

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault()
        if (e.deltaY < 0) {
            handleZoomIn()
        } else {
            handleZoomOut()
        }
    }

    let startPan = { x: 0, y: 0 }

    const eventHandler = (
        { x, y }: { x: number; y: number },
        onMove: (h: (e: PointerEvent) => void) => void,
        onUp: (h: () => void) => void,
    ) => {
        if (zoom() > DEFAULT_ZOOM) {
            setIsPanning(true)
            startPan = { x: x - pan().x, y: y - pan().y }
            onMove(({ x, y }) => {
                if (isPanning() && zoom() > DEFAULT_ZOOM) {
                    setPan({ x: x - startPan.x, y: y - startPan.y })
                }
            })
            onUp(() => {
                setIsPanning(false)
            })
        }
    }

    const handleRotate = () => {
        setRotation((r) => (r + 90) % 360)
    }

    const currentImage = () => props.images[currentIndex()]

    const handlePrevious = () => {
        const newIndex = currentIndex() === 0 ? props.images.length - 1 : currentIndex() - 1
        setCurrentIndex(newIndex)
        resetZoom()
    }

    const handleNext = () => {
        const newIndex = currentIndex() === props.images.length - 1 ? 0 : currentIndex() + 1
        setCurrentIndex(newIndex)
        resetZoom()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
            const newIndex = currentIndex() === 0 ? props.images.length - 1 : currentIndex() - 1
            setCurrentIndex(newIndex)
            resetZoom()
        }
        if (e.key === "ArrowRight") {
            const newIndex = currentIndex() === props.images.length - 1 ? 0 : currentIndex() + 1
            setCurrentIndex(newIndex)
            resetZoom()
        }
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
                                                        resetZoom()
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
                            <div class="flex flex-1 items-center justify-center overflow-hidden p-4">
                                <button
                                    type="button"
                                    onClick={handlePrevious}
                                    class={cx(
                                        "absolute left-4 z-10 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors duration-150 ease hover:bg-white/30",
                                        props.images.length <= 1 && "hidden",
                                    )}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft class="size-6" />
                                </button>

                                <div
                                    ref={imageContainerRef}
                                    class="relative flex max-h-full max-w-full cursor-grab items-center justify-center overflow-hidden"
                                    classList={{ "cursor-grabbing": isPanning() && zoom() > DEFAULT_ZOOM }}
                                    onClick={handleClickZoom}
                                    onWheel={handleWheel}
                                >
                                    <Show when={currentImage()}>
                                        {(imageSrc) => (
                                            <LazyImage
                                                src={imageSrc()}
                                                alt={`Image ${currentIndex() + 1}`}
                                                class="max-h-[80vh] max-w-full object-contain transition-transform duration-150 select-none"
                                                style={{
                                                    transform: `translate(${pan().x}px, ${pan().y}px) scale(${zoom()}) rotate(${rotation()}deg)`,
                                                }}
                                                loading="eager"
                                                draggable="false"
                                            />
                                        )}
                                    </Show>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleNext}
                                    class={cx(
                                        "absolute right-4 z-10 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors duration-150 ease hover:bg-white/30",
                                        props.images.length <= 1 && "hidden",
                                    )}
                                    aria-label="Next image"
                                >
                                    <ChevronRight class="size-6" />
                                </button>
                            </div>

                            <div class="flex flex-wrap items-center justify-center gap-2 p-4">
                                <div class="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handleZoomOut}
                                        class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                                        aria-label="Zoom out"
                                    >
                                        <ZoomOut class="size-5" />
                                    </button>
                                    <span class="min-w-12 text-center text-sm text-white">
                                        {Math.round(zoom() * 100)}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleZoomIn}
                                        class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                                        aria-label="Zoom in"
                                    >
                                        <ZoomIn class="size-5" />
                                    </button>
                                </div>

                                <div class="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={handleRotate}
                                        class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                                        aria-label="Rotate"
                                    >
                                        <RotateCcw class="size-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={toggleFullscreen}
                                        class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                                        aria-label={isFullscreen() ? "Exit fullscreen" : "Fullscreen"}
                                    >
                                        {isFullscreen() ? <Minimize class="size-5" /> : <Maximize class="size-5" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetZoom}
                                        class="rounded-full bg-white/20 px-3 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                                        aria-label="Reset zoom"
                                    >
                                        Reset
                                    </button>
                                </div>

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
