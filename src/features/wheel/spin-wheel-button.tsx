import Play from "lucide-react/icons/play"
import type { ComponentProps } from "react"

import { cx } from "@ui/variants"

import { useWheel } from "./wheel-context"

export function SpinWheelButton(props: ComponentProps<"button">) {
    const wheel = useWheel()

    return (
        <button
            onClick={wheel.spin}
            disabled={wheel.isSpinning || !wheel.canSpin}
            className={cx(
                "group relative flex size-20 items-center justify-center rounded-full transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-pea-600 disabled:cursor-not-allowed sm:size-24",
                wheel.canSpin && !wheel.isSpinning
                    ? "cursor-pointer bg-flame-pea-700 text-white shadow-lg shadow-flame-pea-700/30 hover:scale-105 hover:bg-flame-pea-600 hover:shadow-xl hover:shadow-flame-pea-600/40 active:scale-95 dark:bg-flame-pea-600 dark:hover:bg-flame-pea-500"
                    : "cursor-not-allowed bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500",
                props.className,
            )}
            aria-label={
                wheel.isSpinning ? "Wheel spinning" : wheel.canSpin ? "Spin the wheel" : "Add more restaurants to spin"
            }
        >
            <div className="absolute inset-2 rounded-full border-2 border-white/20" />
            <Play
                className={cx(
                    "ml-1 size-8 transition-all duration-200 sm:size-10",
                    wheel.canSpin && !wheel.isSpinning && "group-hover:ml-1.5 group-hover:scale-110",
                )}
                fill="currentColor"
            />
            {wheel.isSpinning && <span className="absolute inset-0 animate-ping rounded-full bg-flame-pea-600/20" />}
        </button>
    )
}
