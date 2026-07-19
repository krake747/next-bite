import { Button } from "@ui/button"
import ZoomIn from "lucide-react/icons/zoom-in"
import ZoomOut from "lucide-react/icons/zoom-out"
import Maximize from "lucide-react/icons/maximize"
import Minimize from "lucide-react/icons/minimize"
import RotateCcw from "lucide-react/icons/rotate-ccw"

export function ZoomControls({
    zoom,
    onZoomIn,
    onZoomOut,
    onRotate,
    onToggleFullscreen,
    onReset,
    isFullscreen,
    onBackToGrid,
}: {
    zoom: number
    onZoomIn: () => void
    onZoomOut: () => void
    onRotate: () => void
    onToggleFullscreen: () => void
    onReset: () => void
    isFullscreen: boolean
    onBackToGrid: () => void
}) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-2 p-4">
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onZoomOut}
                    className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Zoom out"
                >
                    <ZoomOut className="size-5" />
                </button>
                <span className="min-w-12 text-center text-sm text-white">{Math.round(zoom * 100)}%</span>
                <button
                    type="button"
                    onClick={onZoomIn}
                    className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Zoom in"
                >
                    <ZoomIn className="size-5" />
                </button>
            </div>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onRotate}
                    className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Rotate"
                >
                    <RotateCcw className="size-5" />
                </button>
                <button
                    type="button"
                    onClick={onToggleFullscreen}
                    className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                    {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
                </button>
                <button
                    type="button"
                    onClick={onReset}
                    className="rounded-full bg-white/20 px-3 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Reset zoom"
                >
                    Reset
                </button>
            </div>

            <Button variant="secondary" size="md" onClick={onBackToGrid}>
                Back to Grid
            </Button>
        </div>
    )
}
