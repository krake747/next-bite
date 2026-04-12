import { createSignal, Show, type ComponentProps } from "solid-js"
import { splitProps } from "solid-js"
import { cx } from "./variants"

// Track loaded images globally to prevent flicker on re-renders
const loadedImages = new Set<string>()

type LazyImageProps = Omit<ComponentProps<"img">, "src"> & {
    src?: string | undefined
    alt: string
    loading?: "eager" | "lazy"
    decoding?: "sync" | "async" | "auto"
    aspectRatio?: string
}

export function LazyImage(props: LazyImageProps) {
    const [local, imgProps] = splitProps(props, ["src", "alt", "aspectRatio"])
    // Check if image was already loaded in this session
    const [isLoaded, setIsLoaded] = createSignal(local.src ? loadedImages.has(local.src) : false)
    const [hasError, setHasError] = createSignal(false)

    const handleLoad = () => {
        if (local.src) {
            loadedImages.add(local.src)
        }
        setIsLoaded(true)
    }

    const handleError = () => {
        setHasError(true)
    }

    return (
        <div
            class={cx("relative overflow-hidden", local.aspectRatio && "w-full")}
            style={local.aspectRatio ? { "aspect-ratio": local.aspectRatio } : undefined}
        >
            <Show when={!isLoaded() && !hasError()}>
                <div class="absolute inset-0 animate-pulse bg-[#e8e6e3] dark:bg-[#2d2b29]" />
            </Show>

            <Show when={hasError()}>
                <div class="absolute inset-0 flex items-center justify-center bg-[#f5f4f2] dark:bg-[#2d2b29]">
                    <span class="text-sm text-neutral-500">Failed to load image</span>
                </div>
            </Show>

            <Show when={local.src}>
                {(src) => (
                    <img
                        {...imgProps}
                        src={src()}
                        alt={local.alt}
                        loading={props.loading ?? "lazy"}
                        decoding={props.decoding ?? "async"}
                        class={cx(
                            "h-full w-full object-cover transition-opacity duration-200 ease-out",
                            isLoaded() ? "opacity-100" : "opacity-0",
                            imgProps.class,
                        )}
                        onLoad={handleLoad}
                        onError={handleError}
                    />
                )}
            </Show>
        </div>
    )
}
