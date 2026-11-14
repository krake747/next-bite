import { useState } from "react"

import { AspectRatio } from "@ui/aspect-ratio"
import { cx } from "@ui/cva.config"

const MAX_LOADED_IMAGES = 100

class BoundedImageCache {
    private cache: Map<string, boolean>
    private order: string[]
    private maxSize: number

    constructor(maxSize: number) {
        this.maxSize = maxSize
        this.cache = new Map()
        this.order = []
    }

    has(key: string): boolean {
        return this.cache.has(key)
    }

    add(key: string): void {
        if (this.cache.has(key)) {
            const idx = this.order.indexOf(key)
            if (idx > -1) {
                this.order.splice(idx, 1)
            }
        } else if (this.order.length >= this.maxSize) {
            const oldest = this.order.shift()
            if (oldest !== undefined && oldest !== "") {
                this.cache.delete(oldest)
            }
        }
        this.cache.set(key, true)
        this.order.push(key)
    }
}

const loadedImages = new BoundedImageCache(MAX_LOADED_IMAGES)

type LazyImageProps = {
    readonly src?: string | undefined
    readonly alt: string
    readonly loading?: "eager" | "lazy" | undefined
    readonly decoding?: "sync" | "async" | "auto" | undefined
    readonly ratio?: number | undefined
    readonly className?: string | undefined
    readonly style?: React.CSSProperties | undefined
    readonly draggable?: boolean | undefined
}

function keyForSrc(src: string | undefined): string | null {
    return src !== undefined && src !== "" ? src : null
}

type ImageContentProps = Readonly<LazyImageProps> &
    Readonly<{
        isLoaded: boolean
        hasError: boolean
        onLoad: () => void
        onError: () => void
    }>

function ImageContent({
    src,
    alt,
    loading,
    decoding,
    className,
    isLoaded,
    hasError,
    onLoad,
    onError,
    ...imgProps
}: ImageContentProps) {
    return (
        <>
            {!isLoaded && !hasError && <div className="absolute inset-0 bg-surface-muted" />}

            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-muted">
                    <span className="text-sm text-muted-foreground">Failed to load image</span>
                </div>
            )}

            {src !== undefined && src !== "" && (
                <img
                    src={src}
                    alt={alt}
                    loading={loading ?? "lazy"}
                    decoding={decoding ?? "async"}
                    className={cx("size-full object-cover", isLoaded ? "opacity-100" : "opacity-0", className)}
                    onLoad={onLoad}
                    onError={onError}
                    {...imgProps}
                />
            )}
        </>
    )
}

export function LazyImage({ src, alt, ratio, className, loading, decoding, ...imgProps }: Readonly<LazyImageProps>) {
    const key = keyForSrc(src)
    const [seenKey, setSeenKey] = useState(key)
    const [isLoaded, setIsLoaded] = useState(key !== null && loadedImages.has(key))
    const [hasError, setHasError] = useState(false)

    // Render-time adjustment: src is derived state, reset when it changes.
    if (key !== seenKey) {
        setSeenKey(key)
        setIsLoaded(key !== null && loadedImages.has(key))
        setHasError(false)
    }

    const handleLoad = () => {
        if (src !== undefined && src !== "") {
            loadedImages.add(src)
        }
        setIsLoaded(true)
    }

    const handleError = () => {
        setHasError(true)
    }

    const content = (
        <ImageContent
            src={src}
            alt={alt}
            loading={loading}
            decoding={decoding}
            className={className}
            isLoaded={isLoaded}
            hasError={hasError}
            onLoad={handleLoad}
            onError={handleError}
            {...imgProps}
        />
    )

    if (ratio === undefined) {
        return (
            <div data-slot="lazy-image" className={cx("relative overflow-hidden", className)}>
                {content}
            </div>
        )
    }

    return (
        <AspectRatio ratio={ratio} className="w-full overflow-hidden">
            {content}
        </AspectRatio>
    )
}
