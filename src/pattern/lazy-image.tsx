import { useState, type ComponentProps } from "react"

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
            if (oldest) {
                this.cache.delete(oldest)
            }
        }
        this.cache.set(key, true)
        this.order.push(key)
    }
}

const loadedImages = new BoundedImageCache(MAX_LOADED_IMAGES)

type LazyImageProps = Omit<ComponentProps<"img">, "src"> & {
    src?: string | undefined
    alt: string
    loading?: "eager" | "lazy"
    decoding?: "sync" | "async" | "auto"
    aspectRatio?: string
}

export function LazyImage({ src, alt, aspectRatio, className, loading, decoding, ...imgProps }: LazyImageProps) {
    const [isLoaded, setIsLoaded] = useState(src ? loadedImages.has(src) : false)
    const [hasError, setHasError] = useState(false)

    const handleLoad = () => {
        if (src) {
            loadedImages.add(src)
        }
        setIsLoaded(true)
    }

    const handleError = () => {
        setHasError(true)
    }

    return (
        <div
            className={cx("relative overflow-hidden", aspectRatio && "w-full")}
            style={aspectRatio ? { aspectRatio } : undefined}
        >
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 animate-pulse bg-[#e8e6e3] dark:bg-[#2d2b29]" />
            )}

            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#f5f4f2] dark:bg-[#2d2b29]">
                    <span className="text-sm text-neutral-500">Failed to load image</span>
                </div>
            )}

            {src && (
                <img
                    {...imgProps}
                    src={src}
                    alt={alt}
                    loading={loading ?? "lazy"}
                    decoding={decoding ?? "async"}
                    className={cx(
                        "h-full w-full object-cover transition-opacity duration-200 ease-out",
                        isLoaded ? "opacity-100" : "opacity-0",
                        className,
                    )}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </div>
    )
}
