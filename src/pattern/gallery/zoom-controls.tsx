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
                    <MagnifyingGlassMinusIcon className="size-4" aria-hidden="true" />
                </IconButton>
                <span className="min-w-12 text-center text-sm text-inverse">{Math.round(zoomPan.zoom * 100)}%</span>
                <IconButton label="Zoom in" tone="inverse" size="xs" onClick={zoomPan.zoomIn}>
                    <MagnifyingGlassPlusIcon className="size-4" aria-hidden="true" />
                </IconButton>
            </div>

            <div className="flex items-center gap-1">
                <IconButton label="Rotate" tone="inverse" size="xs" onClick={zoomPan.rotate}>
                    <ArrowCounterClockwiseIcon className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton
                    label={viewer.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    tone="inverse"
                    size="xs"
                    onClick={viewer.toggleFullscreen}
                >
                    {viewer.isFullscreen ? (
                        <CornersInIcon className="size-4" aria-hidden="true" />
                    ) : (
                        <CornersOutIcon className="size-4" aria-hidden="true" />
                    )}
                </IconButton>
                <Button tone="secondary" size="sm" onClick={zoomPan.resetZoom} aria-label="Reset zoom">
                    Reset
                </Button>
            </div>

            <Button tone="secondary" size="md" onClick={viewer.backToGrid}>
                Back to Grid
            </Button>
        </div>
    )
}
