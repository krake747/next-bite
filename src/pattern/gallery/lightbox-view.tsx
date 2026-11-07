import { LazyImage } from "@pattern/lazy-image"
import { cx } from "@ui/cva.config"

import { useGalleryViewer } from "./gallery-viewer"
import { NavigationArrow } from "./navigation-arrow"
import { useZoomPan } from "./use-zoom-pan"
import { ZoomControls } from "./zoom-controls"

const DEFAULT_ZOOM = 1

export function LightboxView() {
    const viewer = useGalleryViewer()
    const zoomPan = useZoomPan(viewer.currentIndex)
    const currentImage = viewer.images[viewer.currentIndex]

    if (currentImage === undefined) {
        return null
    }

    const singleImage = viewer.images.length <= 1

    return (
        <>
            <div className="flex flex-1 items-center justify-center overflow-hidden p-4">
                <NavigationArrow direction="prev" onClick={viewer.showPrevious} hidden={singleImage} />

                <div
                    ref={zoomPan.containerRef}
                    role="region"
                    aria-label={`Image ${viewer.currentIndex + 1} of ${viewer.images.length}. Use plus and minus to zoom, zero to reset.`}
                    tabIndex={0}
                    className={cx(
                        "relative flex max-h-full max-w-full cursor-grab items-center justify-center overflow-hidden",
                        zoomPan.isPanning && zoomPan.zoom > DEFAULT_ZOOM && "cursor-grabbing",
                    )}
                    onClick={zoomPan.clickZoom}
                    onWheel={zoomPan.wheelZoom}
                    onTouchStart={zoomPan.touchStart}
                    onTouchMove={zoomPan.touchMove}
                    onTouchEnd={zoomPan.touchEnd}
                    onKeyDown={(event) => {
                        if (event.key === "+" || event.key === "=") {
                            event.preventDefault()
                            zoomPan.zoomIn()
                        } else if (event.key === "-") {
                            event.preventDefault()
                            zoomPan.zoomOut()
                        } else if (event.key === "0") {
                            event.preventDefault()
                            zoomPan.resetZoom()
                        } else if (event.key === "ArrowRight") {
                            event.preventDefault()
                            viewer.showNext()
                        } else if (event.key === "ArrowLeft") {
                            event.preventDefault()
                            viewer.showPrevious()
                        }
                    }}
                >
                    <LazyImage
                        src={currentImage}
                        alt={`Image ${viewer.currentIndex + 1}`}
                        className="max-h-[80vh] max-w-full object-contain transition-transform duration-150 select-none"
                        style={{
                            transform: `translate(${zoomPan.pan.x}px, ${zoomPan.pan.y}px) scale(${zoomPan.zoom}) rotate(${zoomPan.rotation}deg)`,
                        }}
                        loading="eager"
                        draggable={false}
                    />
                </div>

                <NavigationArrow direction="next" onClick={viewer.showNext} hidden={singleImage} />
            </div>

            <ZoomControls zoomPan={zoomPan} />
        </>
    )
}
