import { createMemo, Show, type ComponentProps } from "solid-js"
import { useWheel } from "./wheel-context"
import { cx } from "../../ui/variants"
import Play from "lucide-solid/icons/play"

export function SpinWheelButton(props: ComponentProps<"button">) {
    const wheel = useWheel()

    const canSpin = createMemo(() => wheel.canSpin())
    const isSpinning = createMemo(() => wheel.isSpinning())

    return (
        <button
            onClick={wheel.spin}
            disabled={isSpinning() || !canSpin()}
            class={cx(
                "group relative flex size-20 items-center justify-center rounded-full transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-pea-600 disabled:cursor-not-allowed sm:size-24",
                canSpin() && !isSpinning()
                    ? "cursor-pointer bg-flame-pea-700 text-white shadow-lg shadow-flame-pea-700/30 hover:scale-105 hover:bg-flame-pea-600 hover:shadow-xl hover:shadow-flame-pea-600/40 active:scale-95 dark:bg-flame-pea-600 dark:hover:bg-flame-pea-500"
                    : "cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500",
                props.class,
            )}
            aria-label={isSpinning() ? "Wheel spinning" : canSpin() ? "Spin the wheel" : "Add more restaurants to spin"}
        >
            {/* Subtle inner ring */}
            <div class="absolute inset-2 rounded-full border-2 border-white/20" />

            {/* Play icon */}
            <Play
                class={cx(
                    "ml-1 size-8 transition-all duration-200 sm:size-10",
                    canSpin() && !isSpinning() && "group-hover:ml-1.5 group-hover:scale-110",
                )}
                fill="currentColor"
            />

            {/* Spinning glow effect */}
            <Show when={isSpinning()}>
                <span class="absolute inset-0 animate-ping rounded-full bg-flame-pea-600/20" />
            </Show>
        </button>
    )
}
