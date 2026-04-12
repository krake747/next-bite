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
        <div class="relative flex items-center justify-center overflow-clip bg-transparent">
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
            <WheelNeedle />
            <SpinWheelButton class="absolute" />
        </div>
    )
}
