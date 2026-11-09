import { Dialog } from "@base-ui/react/dialog"
import { useEffect, useRef, useState } from "react"

import type { Restaurant } from "@core/hooks"
import { formatFileSize } from "@core/image-utils"
import { buildPosterFileName, paintPosterElement, supportsHtmlInCanvas } from "@core/poster.utils"
import { ratingEmoji } from "@pattern/emoji-rating"
import { Badge } from "@ui/badge"
import { Button } from "@ui/button"
import { ErrorBanner } from "@ui/error-banner"

const POSTER_WIDTH = 560
const POSTER_HEIGHT = 700

type BitePosterRestaurant = Pick<
    Restaurant,
    "name" | "cuisine" | "location" | "notes" | "addedBy" | "rating" | "images"
>

type ExportOutcome =
    | { status: "idle" }
    | { status: "exporting" }
    | { status: "done"; fileName: string; sizeLabel: string }
    | { status: "error"; message: string }

export function BitePosterDialog({
    restaurant,
    show,
    onOpenChange,
}: {
    restaurant: BitePosterRestaurant
    show: boolean
    onOpenChange: (open: boolean) => void
}) {
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
            if (urlRef.current !== null) URL.revokeObjectURL(urlRef.current)
        }
    }, [])

    function paint() {
        const canvas = canvasRef.current
        const poster = posterRef.current
        if (canvas === null || poster === null) return
        paintPosterElement(canvas.getContext("2d"), poster)
    }

    useEffect(() => {
        if (!show || !supported) return
        const canvas = canvasRef.current
        const poster = posterRef.current
        if (canvas === null || poster === null) return
        canvas.setAttribute("content", "drawable")
        poster.setAttribute("drawable", "")
        const frame = requestAnimationFrame(paint)
        return () => {
            cancelAnimationFrame(frame)
        }
    }, [show, supported, restaurant])

    function handleOpenChange(open: boolean) {
        if (!open) setOutcome({ status: "idle" })
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
            if (canvasRef.current === null) return
            if (blob === null) {
                setOutcome({ status: "error", message: "Could not render the poster image." })
                return
            }
            if (urlRef.current !== null) URL.revokeObjectURL(urlRef.current)
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
        <Dialog.Root open={show} onOpenChange={handleOpenChange}>
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <Dialog.Popup className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:border-white/10 dark:bg-neutral-900">
                        <Dialog.Title
                            className="text-lg font-semibold text-neutral-900 dark:text-white"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            Share this bite
                        </Dialog.Title>
                        <Dialog.Description className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                            A poster snapshot of {restaurant.name}. Download it to share with friends.
                        </Dialog.Description>
                        <div className="mt-4">
                            <canvas
                                ref={canvasRef}
                                width={POSTER_WIDTH}
                                height={POSTER_HEIGHT}
                                data-slot="bite-poster-canvas"
                                role="img"
                                aria-label={`Poster for ${restaurant.name}`}
                                className="h-auto w-full rounded-xl border border-neutral-200 dark:border-white/10"
                            >
                                <PosterArtwork ref={posterRef} restaurant={restaurant} onImageLoad={paint} />
                            </canvas>
                        </div>
                        {!supported && (
                            <p
                                data-slot="bite-poster-fallback"
                                className="mt-3 text-sm text-neutral-500 dark:text-neutral-400"
                            >
                                Poster download needs Chrome 157 or newer with HTML-in-Canvas support. The preview above
                                stays readable and searchable.
                            </p>
                        )}
                        <PosterExportFooter supported={supported} outcome={outcome} onExport={handleExport} />
                    </Dialog.Popup>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

function PosterArtwork({
    restaurant,
    onImageLoad,
    ref,
}: {
    restaurant: BitePosterRestaurant
    onImageLoad: () => void
    ref: React.Ref<HTMLDivElement>
}) {
    const emoji = ratingEmoji(restaurant.rating ?? null)
    const ratingText = restaurant.rating === undefined ? null : `Rated ${restaurant.rating + 1} out of 7`
    const imageSrc = restaurant.images?.[0]?.url

    return (
        <div ref={ref} data-slot="bite-poster-source" style={{ width: POSTER_WIDTH }}>
            <div className="flex flex-col gap-4 bg-white p-8">
                <div>
                    <Badge variant="editorial">{restaurant.cuisine}</Badge>
                </div>
                <div>
                    <p
                        className="font-semibold tracking-tight text-neutral-900"
                        style={{ fontFamily: "var(--font-display)", fontSize: "40px" }}
                    >
                        {restaurant.name}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">Recommended by {restaurant.addedBy}</p>
                </div>
                {imageSrc !== undefined && (
                    <img
                        src={imageSrc}
                        alt=""
                        onLoad={onImageLoad}
                        className="aspect-2/1 w-full rounded-xl object-cover"
                    />
                )}
                <p className="text-sm text-neutral-600">{restaurant.location}</p>
                {restaurant.notes !== undefined && restaurant.notes !== "" && (
                    <div className="border-l-2 border-flame-pea-400/50 bg-flame-pea-50/30 py-3 pr-3 pl-5">
                        <p className="text-sm leading-relaxed text-neutral-700 italic">{restaurant.notes}</p>
                    </div>
                )}
                {emoji !== null && ratingText !== null && (
                    <div className="flex items-center gap-2">
                        <span className="text-3xl" aria-hidden="true">
                            {emoji}
                        </span>
                        <span className="text-sm font-medium text-neutral-600">{ratingText}</span>
                    </div>
                )}
                <p
                    className="text-xs font-semibold tracking-widest text-flame-pea-700 uppercase"
                    style={{ fontFamily: "var(--font-display)" }}
                >
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
}: {
    supported: boolean
    outcome: ExportOutcome
    onExport: () => void
}) {
    return (
        <>
            {outcome.status === "error" && <ErrorBanner>{outcome.message}</ErrorBanner>}
            {outcome.status === "done" && (
                <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
                    Saved {outcome.fileName} ({outcome.sizeLabel}).
                </p>
            )}
            <div className="mt-6 flex justify-end gap-2">
                <Dialog.Close
                    render={
                        <Button variant="secondary" size="md">
                            Close
                        </Button>
                    }
                />
                {supported && (
                    <Button variant="primary" size="md" onClick={onExport} disabled={outcome.status === "exporting"}>
                        {outcome.status === "exporting"
                            ? "Rendering"
                            : outcome.status === "done"
                              ? "Download again"
                              : "Download poster"}
                    </Button>
                )}
            </div>
        </>
    )
}
