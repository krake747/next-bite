import {
    ArrowCounterClockwiseIcon,
    CornersInIcon,
    CornersOutIcon,
    MagnifyingGlassMinusIcon,
    MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react"

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
                    <MagnifyingGlassMinusIcon className="size-5" />
                </IconButton>
                <span className="min-w-12 text-center text-sm text-inverse">{Math.round(zoomPan.zoom * 100)}%</span>
                <IconButton label="Zoom in" tone="inverse" size="xs" onClick={zoomPan.zoomIn}>
                    <MagnifyingGlassPlusIcon className="size-5" />
                </IconButton>
            </div>

            <div className="flex items-center gap-1">
                <IconButton label="Rotate" tone="inverse" size="xs" onClick={zoomPan.rotate}>
                    <ArrowCounterClockwiseIcon className="size-5" />
                </IconButton>
                <IconButton
                    label={viewer.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    tone="inverse"
                    size="xs"
                    onClick={viewer.toggleFullscreen}
                >
                    {viewer.isFullscreen ? <CornersInIcon className="size-5" /> : <CornersOutIcon className="size-5" />}
                </IconButton>
                <button
                    type="button"
                    onClick={zoomPan.resetZoom}
                    className="rounded-full bg-surface/20 px-3 py-2 text-sm text-inverse backdrop-blur-sm transition-colors hover:bg-surface/30"
                    aria-label="Reset zoom"
                >
                    Reset
                </button>
            </div>

            <Button tone="secondary" size="md" onClick={viewer.backToGrid}>
                Back to Grid
            </Button>
        </div>
    )
}
