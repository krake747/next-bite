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
    readonly style?: Readonly<{ readonly transform?: string }> | undefined
    readonly draggable?: boolean | undefined
}

export function LazyImage({ src, alt, ratio, className, loading, decoding, ...imgProps }: Readonly<LazyImageProps>) {
    const [isLoaded, setIsLoaded] = useState(src !== undefined && src !== "" ? loadedImages.has(src) : false)
    const [hasError, setHasError] = useState(false)

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
                    onLoad={handleLoad}
                    onError={handleError}
                    {...imgProps}
                />
            )}
        </>
    )

    if (ratio === undefined) {
        return (
            <div data-slot="lazy-image" className="relative overflow-hidden">
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
