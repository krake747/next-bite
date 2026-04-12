import { createSignal, Show, type ComponentProps } from "solid-js"
import { splitProps } from "solid-js"
import { cx } from "./variants"

interface LazyImageProps extends Omit<ComponentProps<"img">, "src"> {
    src: string | undefined
    alt: string
    loading?: "eager" | "lazy"
    decoding?: "sync" | "async" | "auto"
    aspectRatio?: string
}

export function LazyImage(props: LazyImageProps) {
    const [local, imgProps] = splitProps(props, ["src", "alt", "aspectRatio"])
    const [isLoaded, setIsLoaded] = createSignal(false)
    const [hasError, setHasError] = createSignal(false)

    return (
        <div
            class={cx("relative overflow-hidden bg-neutral-100 dark:bg-neutral-800", local.aspectRatio && "w-full")}
            style={local.aspectRatio ? { "aspect-ratio": local.aspectRatio } : undefined}
        >
            <Show when={!isLoaded() && !hasError()}>
                <div class="absolute inset-0 animate-pulse bg-neutral-200 dark:bg-neutral-700" />
            </Show>

            <Show when={hasError()}>
                <div class="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
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
                            "h-full w-full object-cover transition-opacity duration-300",
                            isLoaded() ? "opacity-100" : "opacity-0",
                            imgProps.class,
                        )}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setHasError(true)}
                    />
                )}
            </Show>
        </div>
    )
}
