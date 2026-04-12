import { For, createMemo } from "solid-js"
import { useWheel } from "./wheel-context"
import { WHEEL_CONFIG_CONSTANTS } from "./wheel-store"
import { WheelSegment } from "./wheel-segment"
import { WheelNeedle } from "./wheel-needle"
import { SpinWheelButton } from "./spin-wheel-button"

export function SpinningWheel() {
    const wheel = useWheel()
    const { radius, spinDuration } = WHEEL_CONFIG_CONSTANTS
    const size = radius * 2

    const duration = createMemo(() => {
        return wheel.isSpinning() ? spinDuration : 500
    })

    return (
        <div class="relative z-0">
            <div
                class="absolute inset-0 rounded-full bg-linear-to-br from-amber-200 via-neutral-200 to-flame-pea-100 p-2 dark:from-amber-900/30 dark:via-neutral-800 dark:to-flame-pea-900/20"
                style={{
                    width: `${size + 24}px`,
                    height: `${size + 24}px`,
                    top: "-12px",
                    left: "-12px",
                }}
            >
                <div class="size-full rounded-full bg-white shadow-inner dark:bg-[#1a1918]" />
            </div>

            <div class="relative flex items-center justify-center overflow-clip rounded-full bg-white shadow-xl dark:bg-[#1a1918]">
                <svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${size} ${size}`}
                    class="rounded-full"
                    style={{
                        transform: `rotate(${wheel.rotation()}deg)`,
                        transition: wheel.isSpinning()
                            ? `transform ${duration()}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                            : "transform 500ms",
                    }}
                >
                    <For each={wheel.segments()}>
                        {(restaurant, idx) => <WheelSegment restaurant={restaurant} idx={idx()} />}
                    </For>
                </svg>
            </div>

            <WheelNeedle />

            <SpinWheelButton class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
    )
}
