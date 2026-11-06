import Maximize from "lucide-react/icons/maximize"
import Minimize from "lucide-react/icons/minimize"
import RotateCcw from "lucide-react/icons/rotate-ccw"
import ZoomIn from "lucide-react/icons/zoom-in"
import ZoomOut from "lucide-react/icons/zoom-out"

import { Button } from "@ui/button"
import { IconButton } from "@ui/icon-button"

import { useGalleryViewer } from "./gallery-viewer"
import { useZoomPan } from "./use-zoom-pan"

type ZoomHandle = Pick<ReturnType<typeof useZoomPan>, "zoom" | "zoomIn" | "zoomOut" | "rotate" | "resetZoom">

export function ZoomControls({ zoomPan }: Readonly<{ zoomPan: ZoomHandle }>) {
    const viewer = useGalleryViewer()
    return (
        <div className="flex flex-wrap items-center justify-center gap-2 p-4">
            <div className="flex items-center gap-1">
                <IconButton label="Zoom out" tone="inverse" size="xs" onClick={zoomPan.zoomOut}>
                    <ZoomOut className="size-5" />
                </IconButton>
                <span className="min-w-12 text-center text-sm text-white">{Math.round(zoomPan.zoom * 100)}%</span>
                <IconButton label="Zoom in" tone="inverse" size="xs" onClick={zoomPan.zoomIn}>
                    <ZoomIn className="size-5" />
                </IconButton>
            </div>

            <div className="flex items-center gap-1">
                <IconButton label="Rotate" tone="inverse" size="xs" onClick={zoomPan.rotate}>
                    <RotateCcw className="size-5" />
                </IconButton>
                <IconButton
                    label={viewer.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    tone="inverse"
                    size="xs"
                    onClick={viewer.toggleFullscreen}
                >
                    {viewer.isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
                </IconButton>
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
