import { useEffect, useRef, useState } from "react"

import { formatFileSize } from "@core/image.utils"
import { buildPosterFileName, paintPosterElement, supportsHtmlInCanvas } from "@core/poster.utils"
import { type Restaurant } from "@core/restaurants"
import { ratingEmoji } from "@pattern/emoji-rating"
import { ErrorBanner } from "@pattern/error-banner"
import { Button } from "@ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@ui/dialog"

const POSTER_WIDTH = 560
const POSTER_HEIGHT = 700

type BitePosterRestaurant = Pick<
    Restaurant,
    "name" | "cuisine" | "address" | "details" | "rating" | "images" | "ownerName"
>

type ExportOutcome =
    | { readonly status: "idle" }
    | { readonly status: "exporting" }
    | { readonly status: "done"; readonly fileName: string; readonly sizeLabel: string }
    | { readonly status: "error"; readonly message: string }

export function BitePosterDialog({
    restaurant,
    show,
    onOpenChange,
}: Readonly<{
    restaurant: BitePosterRestaurant
    show: boolean
    onOpenChange: (open: boolean) => void
}>) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const posterRef = useRef<HTMLDivElement | null>(null)
    const urlRef = useRef<string | null>(null)
    const [supported, setSupported] = useState(false)
    const [outcome, setOutcome] = useState<ExportOutcome>({ status: "idle" })

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            setSupported(supportsHtmlInCanvas())
        })
        return () => {
            cancelAnimationFrame(frame)
        }
    }, [])

    useEffect(() => {
        return () => {
            if (urlRef.current !== null) {
                URL.revokeObjectURL(urlRef.current)
            }
        }
    }, [])

    function paint() {
        const canvas = canvasRef.current
        const poster = posterRef.current
        if (canvas === null || poster === null) {
            return
        }
        paintPosterElement(canvas.getContext("2d"), poster)
    }

    useEffect(() => {
        let frame = 0
        let observer: ResizeObserver | null = null
        if (show && supported) {
            const canvas = canvasRef.current
            const poster = posterRef.current
            if (canvas !== null && poster !== null) {
                canvas.setAttribute("content", "drawable")
                poster.setAttribute("drawable", "")
                const repaint = () => {
                    paintPosterElement(canvas.getContext("2d"), poster)
                }
                frame = requestAnimationFrame(repaint)
                observer = new ResizeObserver(repaint)
                observer.observe(poster)
            }
        }
        return () => {
            cancelAnimationFrame(frame)
            observer?.disconnect()
        }
    }, [show, supported, restaurant])

    function handleOpenChange(open: boolean) {
        if (!open) {
            setOutcome({ status: "idle" })
        }
        onOpenChange(open)
    }

    function handleExport() {
        const canvas = canvasRef.current
        if (canvas === null || !supported) {
            setOutcome({
                status: "error",
                message: "Poster download needs a browser with HTML-in-Canvas support.",
            })
            return
        }
        setOutcome({ status: "exporting" })
        canvas.toBlob((blob) => {
            if (canvasRef.current === null) {
                return
            }
            if (blob === null) {
                setOutcome({ status: "error", message: "Could not render the poster image." })
                return
            }
            if (urlRef.current !== null) {
                URL.revokeObjectURL(urlRef.current)
            }
            const url = URL.createObjectURL(blob)
            urlRef.current = url
            const fileName = buildPosterFileName(restaurant.name)
            const link = document.createElement("a")
            link.href = url
            link.download = fileName
            link.click()
            setOutcome({ status: "done", fileName, sizeLabel: formatFileSize(blob.size) })
        }, "image/png")
    }

    return (
        <Dialog open={show} onOpenChange={handleOpenChange}>
            <DialogContent
                size="md"
                showCloseButton={false}
                className="max-h-[90vh] max-w-[min(42rem,calc(100%-2rem))]"
                aria-label={`Poster for ${restaurant.name}`}
            >
                <DialogTitle>Share this bite</DialogTitle>
                <DialogDescription>
                    A poster snapshot of {restaurant.name}. Download it to share with friends.
                </DialogDescription>
                <div className="mt-4">
                    <canvas
                        ref={canvasRef}
                        width={POSTER_WIDTH}
                        height={POSTER_HEIGHT}
                        data-slot="bite-poster-canvas"
                        role="img"
                        aria-label={`Poster for ${restaurant.name}`}
                        className="h-auto w-full rounded-control border border-border"
                    >
                        <PosterArtwork ref={posterRef} restaurant={restaurant} onImageLoad={paint} />
                    </canvas>
                </div>
                {!supported && (
                    <p data-slot="bite-poster-fallback" className="mt-3 text-sm text-muted-foreground">
                        Poster download needs Chrome 157 or newer with HTML-in-Canvas support. The preview above stays
                        readable and searchable.
                    </p>
                )}
                <PosterExportFooter supported={supported} outcome={outcome} onExport={handleExport} />
            </DialogContent>
        </Dialog>
    )
}

function PosterArtwork({
    restaurant,
    onImageLoad,
    ref,
}: Readonly<{
    restaurant: BitePosterRestaurant
    onImageLoad: () => void
    ref: React.Ref<HTMLDivElement>
}>) {
    const emoji = ratingEmoji(restaurant.rating)
    const ratingText = restaurant.rating === undefined ? null : `Rated ${restaurant.rating} out of 7`
    const imageSrc = restaurant.images[0]?.url

    return (
        <div ref={ref} data-slot="bite-poster-source" style={{ width: POSTER_WIDTH }}>
            <div className="flex flex-col gap-4 bg-surface p-8">
                <div>
                    <p className="font-display text-xs font-semibold tracking-widest text-tomato-600 uppercase">
                        {restaurant.cuisine}
                    </p>
                </div>
                <div>
                    <p className="font-display text-4xl font-semibold tracking-tight text-foreground">
                        {restaurant.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Recommended by {restaurant.ownerName}</p>
                </div>
                {imageSrc !== undefined && (
                    <img
                        src={imageSrc}
                        alt=""
                        onLoad={onImageLoad}
                        className="aspect-2/1 w-full rounded-control object-cover"
                    />
                )}
                <p className="text-sm text-muted-foreground">{restaurant.address.label}</p>
                {restaurant.details?.notes !== undefined && restaurant.details.notes !== "" && (
                    <div className="border-l-2 border-tomato-400/50 bg-tomato-50/30 py-3 pr-3 pl-5">
                        <p className="text-sm leading-relaxed text-foreground italic">{restaurant.details.notes}</p>
                    </div>
                )}
                {emoji !== null && ratingText !== null && (
                    <div className="flex items-center gap-2">
                        <span className="text-3xl" aria-hidden="true">
                            {emoji}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">{ratingText}</span>
                    </div>
                )}
                <p className="font-display text-xs font-semibold tracking-widest text-tomato-600 uppercase">
                    Next Bite
                </p>
            </div>
        </div>
    )
}

function PosterExportFooter({
    supported,
    outcome,
    onExport,
}: Readonly<{
    supported: boolean
    outcome: ExportOutcome
    onExport: () => void
}>) {
    return (
        <>
            {outcome.status === "error" && <ErrorBanner>{outcome.message}</ErrorBanner>}
            {outcome.status === "done" && (
                <p className="mt-3 text-sm text-muted-foreground">
                    Saved {outcome.fileName} ({outcome.sizeLabel}).
                </p>
            )}
            <DialogFooter className="mt-6">
                <DialogClose
                    render={
                        <Button tone="secondary" size="md">
                            Close
                        </Button>
                    }
                />
                {supported && (
                    <Button tone="primary" size="md" onClick={onExport} disabled={outcome.status === "exporting"}>
                        {outcome.status === "exporting"
                            ? "Rendering"
                            : outcome.status === "done"
                              ? "Download again"
                              : "Download poster"}
                    </Button>
                )}
            </DialogFooter>
        </>
    )
}
