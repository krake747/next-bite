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
            {/* Metallic chrome ring with conic gradient for realistic metal effect */}
            <div
                class="absolute inset-0 rounded-full p-3"
                style={{
                    width: `${size + 28}px`,
                    height: `${size + 28}px`,
                    top: "-14px",
                    left: "-14px",
                    background: `conic-gradient(
                        from 0deg,
                        #c9a961 0deg,
                        #f4e8c1 15deg,
                        #8b7355 30deg,
                        #d4af37 45deg,
                        #fff8dc 60deg,
                        #b8860b 75deg,
                        #e6d5a8 90deg,
                        #cd853f 105deg,
                        #f5deb3 120deg,
                        #d4af37 135deg,
                        #fffacd 150deg,
                        #b8860b 165deg,
                        #c9a961 180deg,
                        #f4e8c1 195deg,
                        #8b7355 210deg,
                        #d4af37 225deg,
                        #fff8dc 240deg,
                        #b8860b 255deg,
                        #e6d5a8 270deg,
                        #cd853f 285deg,
                        #f5deb3 300deg,
                        #d4af37 315deg,
                        #fffacd 330deg,
                        #b8860b 345deg,
                        #c9a961 360deg
                    )`,
                    boxShadow: `
                        0 0 0 1px rgba(0,0,0,0.1),
                        0 4px 20px rgba(0,0,0,0.15),
                        inset 0 2px 4px rgba(255,255,255,0.3),
                        inset 0 -2px 4px rgba(0,0,0,0.1)
                    `,
                }}
            >
                {/* Inner groove effect */}
                <div
                    class="size-full rounded-full"
                    style={{
                        background: `linear-gradient(145deg, #1a1918 0%, #2d2b29 50%, #1a1918 100%)`,
                        boxShadow: `
                            inset 0 3px 8px rgba(0,0,0,0.4),
                            inset 0 -2px 4px rgba(255,255,255,0.05),
                            0 1px 2px rgba(255,255,255,0.1)
                        `,
                    }}
                />
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
