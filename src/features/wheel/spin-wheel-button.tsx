import { createMemo, Show, type ComponentProps } from "solid-js"
import { useWheel } from "./wheel-context"
import { WHEEL_CONFIG_CONSTANTS } from "./wheel-store"
import { cx } from "../../ui/variants"
import RotateCw from "lucide-solid/icons/rotate-cw"

export function SpinWheelButton(props: ComponentProps<"button">) {
    const wheel = useWheel()
    const { spinDuration } = WHEEL_CONFIG_CONSTANTS

    const duration = createMemo(() => {
        return wheel.isSpinning() ? spinDuration : 500
    })

    // Use memos to ensure reactivity
    const canSpin = createMemo(() => wheel.canSpin())
    const isSpinning = createMemo(() => wheel.isSpinning())

    return (
        <button
            onClick={wheel.spin}
            disabled={isSpinning() || !canSpin()}
            class={cx(
                "group relative flex size-20 items-center justify-center rounded-full transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-pea-700 disabled:cursor-not-allowed sm:size-24",
                canSpin() && !isSpinning()
                    ? "bg-flame-pea-700 text-white shadow-lg shadow-flame-pea-700/25 hover:scale-105 hover:bg-flame-pea-600 hover:shadow-xl hover:shadow-flame-pea-700/30 active:scale-95"
                    : "bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500",
                props.class,
            )}
            aria-label={isSpinning() ? "Wheel spinning" : canSpin() ? "Spin the wheel" : "Add more restaurants to spin"}
        >
            {/* Inner ring decoration */}
            <div class="absolute inset-2 rounded-full border-2 border-white/20" />

            {/* Icon with rotation */}
            <RotateCw
                class={cx(
                    "size-8 transition-transform duration-200 sm:size-10",
                    canSpin() && !isSpinning() && "group-hover:rotate-180",
                )}
                style={{
                    transform: `rotate(${wheel.rotation()}deg)`,
                    transition: isSpinning()
                        ? `transform ${duration()}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                        : "transform 200ms ease-out",
                }}
            />

            {/* Ripple effect when spinning */}
            <Show when={isSpinning()}>
                <span class="absolute inset-0 animate-ping rounded-full bg-flame-pea-700/20" />
                <span class="absolute -inset-2 animate-pulse rounded-full bg-flame-pea-700/10" />
            </Show>
        </button>
    )
}
