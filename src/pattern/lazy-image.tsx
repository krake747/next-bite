import { useState } from "react"

import { cx } from "@ui/variants"

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
    readonly aspectRatio?: string | undefined
    readonly className?: string | undefined
    readonly style?: Readonly<{ readonly transform?: string }> | undefined
    readonly draggable?: boolean | undefined
}

export function LazyImage({
    src,
    alt,
    aspectRatio,
    className,
    loading,
    decoding,
    ...imgProps
}: Readonly<LazyImageProps>) {
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

    return (
        <div
            className={cx("relative overflow-hidden", aspectRatio !== undefined && aspectRatio !== "" && "w-full")}
            style={aspectRatio !== undefined && aspectRatio !== "" ? { aspectRatio } : undefined}
        >
            {!isLoaded && !hasError && <div className="absolute inset-0 animate-pulse bg-stone-200" />}

            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
                    <span className="text-sm text-stone-600">Failed to load image</span>
                </div>
            )}

            {src !== undefined && src !== "" && (
                <img
                    src={src}
                    alt={alt}
                    loading={loading ?? "lazy"}
                    decoding={decoding ?? "async"}
                    className={cx(
                        "size-full object-cover transition-opacity duration-200 ease-out-quad",
                        isLoaded ? "opacity-100" : "opacity-0",
                        className,
                    )}
                    onLoad={handleLoad}
                    onError={handleError}
                    {...imgProps}
                />
            )}
        </div>
    )
}
