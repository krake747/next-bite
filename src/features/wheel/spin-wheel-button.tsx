import { createMemo } from "solid-js"
import { type ComponentProps } from "solid-js"
import { useWheel } from "./wheel-context"
import { WHEEL_CONFIG_CONSTANTS } from "./wheel-store"
import { Button } from "../../ui/button"
import { cx } from "../../ui/variants"
import RotateCw from "lucide-solid/icons/rotate-cw"

export function SpinWheelButton(props: ComponentProps<"button">) {
    const wheel = useWheel()
    const { spinDuration } = WHEEL_CONFIG_CONSTANTS

    const duration = createMemo(() => {
        return wheel.isSpinning() ? spinDuration : 500
    })

    return (
        <Button
            onClick={wheel.spin}
            disabled={wheel.isSpinning() || !wheel.canSpin()}
            class={cx("size-18 rounded-full bg-neutral-50", props.class)}
            variant="secondary"
            aria-label="Spin the wheel"
        >
            <RotateCw
                class="size-6"
                style={{
                    transform: `rotate(${wheel.rotation()}deg)`,
                    transition: wheel.isSpinning()
                        ? `transform ${duration()}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                        : "transform 500ms",
                }}
            />
        </Button>
    )
}
