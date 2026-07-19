import { useState, useEffect, useRef } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { LazyImage } from "./lazy-image"
import { NavigationArrow } from "./gallery/navigation-arrow"
import { ZoomControls } from "./gallery/zoom-controls"
import { GalleryGrid } from "./gallery/gallery-grid"
import X from "lucide-react/icons/x"

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
    const [currentIndex, setCurrentIndex] = useState(props.initialIndex ?? 0)
    const [lightboxOpen, setLightboxOpen] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState<PanState>({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [rotation, setRotation] = useState(0)
    const imageContainerRef = useRef<HTMLDivElement>(null)
    const dialogContentRef = useRef<HTMLDivElement>(null)
    const initialPinchDistance = useRef<number | undefined>(undefined)
    const initialPinchZoom = useRef<number | undefined>(undefined)
    const startPan = useRef({ x: 0, y: 0 })
    const suppressClickAfterPanRef = useRef(false)

    const PAN_THRESHOLD = 5

    const getTouchDistance = (touches: React.TouchList) => {
        if (touches.length < 2) return 0
        const touch0 = touches[0]
        const touch1 = touches[1]
        if (!touch0 || !touch1) return 0
        const dx = touch0.clientX - touch1.clientX
        const dy = touch0.clientY - touch1.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault()
            initialPinchDistance.current = getTouchDistance(e.touches)
            initialPinchZoom.current = zoom
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && initialPinchDistance.current && initialPinchZoom.current) {
            e.preventDefault()
            const currentDistance = getTouchDistance(e.touches)
            const scale = currentDistance / initialPinchDistance.current
            const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialPinchZoom.current * scale))
            setZoom(newZoom)
            if (newZoom <= DEFAULT_ZOOM) {
                setPan({ x: 0, y: 0 })
            }
        }
    }

    const handleTouchEnd = () => {
        initialPinchDistance.current = undefined
        initialPinchZoom.current = undefined
    }

    useEffect(() => {
        setCurrentIndex(props.initialIndex ?? 0)
    }, [props.initialIndex])

    useEffect(() => {
        const container = imageContainerRef.current
        if (!container) return

        let ptrRef: { x: number; y: number } | null = null

        const onPointerDown = (e: PointerEvent) => {
            if (zoom <= DEFAULT_ZOOM) return
            e.preventDefault()
            container.setPointerCapture(e.pointerId)
            ptrRef = { x: e.clientX, y: e.clientY }
            startPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
            setIsPanning(true)
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!ptrRef) return
            const dx = Math.abs(e.clientX - ptrRef.x)
            const dy = Math.abs(e.clientY - ptrRef.y)
            if (dx > PAN_THRESHOLD || dy > PAN_THRESHOLD) {
                suppressClickAfterPanRef.current = true
            }
            setPan({ x: e.clientX - startPan.current.x, y: e.clientY - startPan.current.y })
        }

        const onPointerUp = () => {
            ptrRef = null
            setIsPanning(false)
            queueMicrotask(() => {
                suppressClickAfterPanRef.current = false
            })
        }

        container.addEventListener("pointerdown", onPointerDown)
        container.addEventListener("pointermove", onPointerMove)
        container.addEventListener("pointerup", onPointerUp)

        return () => {
            container.removeEventListener("pointerdown", onPointerDown)
            container.removeEventListener("pointermove", onPointerMove)
            container.removeEventListener("pointerup", onPointerUp)
        }
    }, [zoom, pan.x, pan.y])

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
        if (suppressClickAfterPanRef.current) {
            suppressClickAfterPanRef.current = false
            return
        }
        if (zoom > DEFAULT_ZOOM) {
            setZoom(DEFAULT_ZOOM)
            setPan({ x: 0, y: 0 })
            setRotation(0)
        } else {
            setZoom(2)
        }
    }

    const toggleFullscreen = async () => {
        const elem = dialogContentRef.current
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

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }, [])

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        if (e.deltaY < 0) {
            handleZoomIn()
        } else {
            handleZoomOut()
        }
    }

    const handleRotate = () => {
        setRotation((r) => (r + 90) % 360)
    }

    const currentImage = props.images[currentIndex]
    if (currentImage === undefined) return null

    const handlePrevious = () => {
        const newIndex = currentIndex === 0 ? props.images.length - 1 : currentIndex - 1
        setCurrentIndex(newIndex)
        resetZoom()
    }

    const handleNext = () => {
        const newIndex = currentIndex === props.images.length - 1 ? 0 : currentIndex + 1
        setCurrentIndex(newIndex)
        resetZoom()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
            const newIndex = currentIndex === 0 ? props.images.length - 1 : currentIndex - 1
            setCurrentIndex(newIndex)
            resetZoom()
        }
        if (e.key === "ArrowRight") {
            const newIndex = currentIndex === props.images.length - 1 ? 0 : currentIndex + 1
            setCurrentIndex(newIndex)
            resetZoom()
        }
        if (e.key === "Escape") {
            if (lightboxOpen) {
                setLightboxOpen(false)
            } else {
                props.onOpenChange(false)
            }
        }
    }

    return (
        <Dialog.Root open={props.show} onOpenChange={props.onOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/90">
                    <Dialog.Popup
                        ref={dialogContentRef}
                        className="fixed inset-0 flex flex-col outline-none"
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                    >
                        <div className="flex items-center justify-between p-4">
                            <Dialog.Title className="text-lg font-semibold text-white">
                                Image Gallery ({currentIndex + 1}/{props.images.length})
                            </Dialog.Title>
                            <button
                                type="button"
                                onClick={() => props.onOpenChange(false)}
                                className="rounded-full p-2 text-white hover:bg-white/20"
                                aria-label="Close gallery"
                            >
                                <X className="size-6" />
                            </button>
                        </div>

                        {!lightboxOpen ? (
                            <GalleryGrid
                                images={props.images}
                                onSelect={(index) => {
                                    setCurrentIndex(index)
                                    resetZoom()
                                    setLightboxOpen(true)
                                }}
                            />
                        ) : (
                            <>
                                <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
                                    <NavigationArrow
                                        direction="prev"
                                        onClick={handlePrevious}
                                        hidden={props.images.length <= 1}
                                    />

                                    <div
                                        ref={imageContainerRef}
                                        className={`relative flex max-h-full max-w-full cursor-grab items-center justify-center overflow-hidden ${isPanning && zoom > DEFAULT_ZOOM ? "cursor-grabbing" : ""}`}
                                        onClick={handleClickZoom}
                                        onWheel={handleWheel}
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                    >
                                        <LazyImage
                                            src={currentImage}
                                            alt={`Image ${currentIndex + 1}`}
                                            className="max-h-[80vh] max-w-full object-contain transition-transform duration-150 select-none"
                                            style={{
                                                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                                            }}
                                            loading="eager"
                                            draggable={false}
                                        />
                                    </div>

                                    <NavigationArrow
                                        direction="next"
                                        onClick={handleNext}
                                        hidden={props.images.length <= 1}
                                    />
                                </div>

                                <ZoomControls
                                    zoom={zoom}
                                    onZoomIn={handleZoomIn}
                                    onZoomOut={handleZoomOut}
                                    onRotate={handleRotate}
                                    onToggleFullscreen={toggleFullscreen}
                                    onReset={resetZoom}
                                    isFullscreen={isFullscreen}
                                    onBackToGrid={() => setLightboxOpen(false)}
                                />
                            </>
                        )}
                    </Dialog.Popup>
                </Dialog.Backdrop>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
