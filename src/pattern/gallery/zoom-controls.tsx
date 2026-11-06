import Maximize from "lucide-react/icons/maximize"
import Minimize from "lucide-react/icons/minimize"
import RotateCcw from "lucide-react/icons/rotate-ccw"
import ZoomIn from "lucide-react/icons/zoom-in"
import ZoomOut from "lucide-react/icons/zoom-out"

import { Button } from "@ui/button"

import { useGalleryViewer } from "./gallery-viewer"
import { useZoomPan } from "./use-zoom-pan"

type ZoomHandle = Pick<ReturnType<typeof useZoomPan>, "zoom" | "zoomIn" | "zoomOut" | "rotate" | "resetZoom">

export function ZoomControls({ zoomPan }: Readonly<{ zoomPan: ZoomHandle }>) {
    const viewer = useGalleryViewer()
    return (
        <div className="flex flex-wrap items-center justify-center gap-2 p-4">
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={zoomPan.zoomOut}
                    className="rounded-full bg-surface/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-surface/30"
                    aria-label="Zoom out"
                >
                    <ZoomOut className="size-5" />
                </button>
                <span className="min-w-12 text-center text-sm text-white">{Math.round(zoomPan.zoom * 100)}%</span>
                <button
                    type="button"
                    onClick={zoomPan.zoomIn}
                    className="rounded-full bg-surface/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-surface/30"
                    aria-label="Zoom in"
                >
                    <ZoomIn className="size-5" />
                </button>
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={zoomPan.rotate}
                    className="rounded-full bg-surface/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-surface/30"
                    aria-label="Rotate"
                >
                    <RotateCcw className="size-5" />
                </button>
                <button
                    type="button"
                    onClick={viewer.toggleFullscreen}
                    className="rounded-full bg-surface/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-surface/30"
                    aria-label={viewer.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                    {viewer.isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
                </button>
                <button
                    type="button"
                    onClick={zoomPan.resetZoom}
                    className="rounded-full bg-surface/20 px-3 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-surface/30"
                    aria-label="Reset zoom"
                >
                    Reset
                </button>
            </div>

            <Button variant="secondary" size="md" onClick={viewer.backToGrid}>
                Back to Grid
            </Button>
        </div>
    )
}
