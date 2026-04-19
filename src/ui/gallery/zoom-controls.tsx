import { Button } from "@ui/button"
import ZoomIn from "lucide-solid/icons/zoom-in"
import ZoomOut from "lucide-solid/icons/zoom-out"
import Maximize from "lucide-solid/icons/maximize"
import Minimize from "lucide-solid/icons/minimize"
import RotateCcw from "lucide-solid/icons/rotate-ccw"

export function ZoomControls(props: {
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
        <div class="flex flex-wrap items-center justify-center gap-2 p-4">
            <div class="flex items-center gap-1">
                <button
                    type="button"
                    onClick={props.onZoomOut}
                    class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Zoom out"
                >
                    <ZoomOut class="size-5" />
                </button>
                <span class="min-w-12 text-center text-sm text-white">{Math.round(props.zoom * 100)}%</span>
                <button
                    type="button"
                    onClick={props.onZoomIn}
                    class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Zoom in"
                >
                    <ZoomIn class="size-5" />
                </button>
            </div>

            <div class="flex items-center gap-1">
                <button
                    type="button"
                    onClick={props.onRotate}
                    class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Rotate"
                >
                    <RotateCcw class="size-5" />
                </button>
                <button
                    type="button"
                    onClick={props.onToggleFullscreen}
                    class="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label={props.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                    {props.isFullscreen ? <Minimize class="size-5" /> : <Maximize class="size-5" />}
                </button>
                <button
                    type="button"
                    onClick={props.onReset}
                    class="rounded-full bg-white/20 px-3 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                    aria-label="Reset zoom"
                >
                    Reset
                </button>
            </div>

            <Button variant="secondary" size="md" onClick={props.onBackToGrid}>
                Back to Grid
            </Button>
        </div>
    )
}
