import { createContext, use, useEffect, useRef, useState } from "react"

type GalleryMode = "grid" | "lightbox"

type GalleryViewerValue = {
    readonly images: ReadonlyArray<string>
    readonly currentIndex: number
    readonly mode: GalleryMode
    readonly isFullscreen: boolean
    readonly contentRef: React.RefObject<HTMLDivElement | null>
    readonly openLightbox: (index: number) => void
    readonly backToGrid: () => void
    readonly showPrevious: () => void
    readonly showNext: () => void
    readonly select: (index: number) => void
    readonly toggleFullscreen: () => void
}

const GalleryViewerContext = createContext<GalleryViewerValue | null>(null)

export function useGalleryViewer(): GalleryViewerValue {
    const value = use(GalleryViewerContext)
    if (value === null) {
        throw new Error("useGalleryViewer must be used inside GalleryViewer")
    }
    return value
}

export function GalleryViewer({
    images,
    initialIndex,
    children,
}: Readonly<{
    images: ReadonlyArray<string>
    initialIndex?: number | undefined
    children: React.ReactNode
}>) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex ?? 0)
    const [mode, setMode] = useState<GalleryMode>("grid")
    const [isFullscreen, setIsFullscreen] = useState(false)
    const contentRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement !== null)
        }
        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange)
        }
    }, [])

    const select = (index: number) => {
        setCurrentIndex(index)
    }

    const openLightbox = (index: number) => {
        select(index)
        setMode("lightbox")
    }

    const backToGrid = () => {
        setMode("grid")
    }

    const showPrevious = () => {
        setCurrentIndex((index) => (index === 0 ? images.length - 1 : index - 1))
    }

    const showNext = () => {
        setCurrentIndex((index) => (index === images.length - 1 ? 0 : index + 1))
    }

    const toggleFullscreen = () => {
        const element = contentRef.current
        if (!element) {
            return
        }
        if (!document.fullscreenElement) {
            void element.requestFullscreen().then(
                () => {
                    setIsFullscreen(true)
                },
                () => {},
            )
        } else {
            void document.exitFullscreen().then(
                () => {
                    setIsFullscreen(false)
                },
                () => {},
            )
        }
    }

    return (
        <GalleryViewerContext.Provider
            value={{
                images,
                currentIndex,
                mode,
                isFullscreen,
                contentRef,
                openLightbox,
                backToGrid,
                showPrevious,
                showNext,
                select,
                toggleFullscreen,
            }}
        >
            {children}
        </GalleryViewerContext.Provider>
    )
}
