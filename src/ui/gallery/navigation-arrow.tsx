import { type Component } from "solid-js"
import { cx } from "../variants"

type NavigationArrowProps = {
    direction: "prev" | "next"
    onClick: () => void
    hidden?: boolean
    disabled?: boolean
}

export const NavigationArrow: Component<NavigationArrowProps> = (props) => {
    const isPrev = () => props.direction === "prev"

    return (
        <button
            type="button"
            onClick={props.onClick}
            disabled={props.disabled}
            class={cx(
                "absolute z-10 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors duration-150 ease hover:bg-white/30",
                isPrev() ? "left-4" : "right-4",
                props.hidden && "hidden",
            )}
            aria-label={`${props.direction} image`}
        >
            {isPrev() ? (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
            ) : (
                <svg class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
            )}
        </button>
    )
}
