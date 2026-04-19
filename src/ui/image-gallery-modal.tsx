import { createSignal, Show, createEffect, onCleanup } from "solid-js"
import { Dialog } from "@kobalte/core/dialog"
import { LazyImage } from "./lazy-image"
import { createPerPointerListeners } from "@solid-primitives/pointer"
import { NavigationArrow } from "./gallery/navigation-arrow"
import { ZoomControls } from "./gallery/zoom-controls"
import { GalleryGrid } from "./gallery/gallery-grid"
import X from "lucide-solid/icons/x"

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
    const [suppressClickAfterPan, setSuppressClickAfterPan] = createSignal(false)
    let imageContainerRef: HTMLDivElement | undefined // eslint-disable-line no-unassigned-vars
    let dialogContentRef: HTMLDivElement | undefined // eslint-disable-line no-unassigned-vars
    let initialPinchDistance: number | undefined
    let initialPinchZoom: number | undefined

    const getTouchDistance = (touches: TouchList) => {
        if (touches.length < 2) return 0
        const touch0 = touches[0]
        const touch1 = touches[1]
        if (!touch0 || !touch1) return 0
        const dx = touch0.clientX - touch1.clientX
        const dy = touch0.clientY - touch1.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault()
            initialPinchDistance = getTouchDistance(e.touches)
            initialPinchZoom = zoom()
        }
    }

    const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2 && initialPinchDistance && initialPinchZoom) {
            e.preventDefault()
            const currentDistance = getTouchDistance(e.touches)
            const scale = currentDistance / initialPinchDistance
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialPinchZoom * scale))
            setZoom(newZoom)
            if (newZoom <= DEFAULT_ZOOM) {
                setPan({ x: 0, y: 0 })
            }
        }
    }

    const handleTouchEnd = () => {
        initialPinchDistance = undefined
        initialPinchZoom = undefined
    }

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
        if (suppressClickAfterPan()) {
            setSuppressClickAfterPan(false)
            return
        }
        if (zoom() > DEFAULT_ZOOM) {
            setZoom(DEFAULT_ZOOM)
            setPan({ x: 0, y: 0 })
            setRotation(0)
        } else {
            setZoom(2)
        }
    }

    const toggleFullscreen = async () => {
        const elem = dialogContentRef
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

    const PAN_THRESHOLD = 5

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
                    const newPan = { x: x - startPan.x, y: y - startPan.y }
                    setPan(newPan)
                    if (Math.abs(newPan.x - pan().x) > PAN_THRESHOLD || Math.abs(newPan.y - pan().y) > PAN_THRESHOLD) {
                        setSuppressClickAfterPan(true)
                    }
                }
            })
            onUp(() => {
                setIsPanning(false)
                setSuppressClickAfterPan(true)
                queueMicrotask(() => setSuppressClickAfterPan(false))
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
                        ref={dialogContentRef}
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
                                <GalleryGrid
                                    images={props.images}
                                    onSelect={(index) => {
                                        setCurrentIndex(index)
                                        resetZoom()
                                        setLightboxOpen(true)
                                    }}
                                />
                            }
                        >
                            <div class="flex flex-1 items-center justify-center overflow-hidden p-4">
                                <NavigationArrow
                                    direction="prev"
                                    onClick={handlePrevious}
                                    hidden={props.images.length <= 1}
                                />

                                <div
                                    ref={imageContainerRef}
                                    class="relative flex max-h-full max-w-full cursor-grab items-center justify-center overflow-hidden"
                                    classList={{ "cursor-grabbing": isPanning() && zoom() > DEFAULT_ZOOM }}
                                    onClick={handleClickZoom}
                                    onWheel={handleWheel}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
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

                                <NavigationArrow
                                    direction="next"
                                    onClick={handleNext}
                                    hidden={props.images.length <= 1}
                                />
                            </div>

                            <ZoomControls
                                zoom={zoom()}
                                onZoomIn={handleZoomIn}
                                onZoomOut={handleZoomOut}
                                onRotate={handleRotate}
                                onToggleFullscreen={toggleFullscreen}
                                onReset={resetZoom}
                                isFullscreen={isFullscreen()}
                                onBackToGrid={() => setLightboxOpen(false)}
                            />
                        </Show>
                    </Dialog.Content>
                </Dialog.Overlay>
            </Dialog.Portal>
        </Dialog>
    )
}
