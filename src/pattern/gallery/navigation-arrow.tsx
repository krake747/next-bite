import { cx } from "@ui/variants"

export function NavigationArrow({
    direction,
    onClick,
    hidden,
    disabled,
}: {
    direction: "prev" | "next"
    onClick: () => void
    hidden?: boolean
    disabled?: boolean
}) {
    const isPrev = direction === "prev"

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cx(
                "absolute z-10 rounded-full bg-white/20 p-3 text-white backdrop-blur-sm transition-colors duration-150 ease hover:bg-white/30",
                isPrev ? "left-4" : "right-4",
                hidden && "hidden",
            )}
            aria-label={`${direction} image`}
        >
            {isPrev ? (
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
            ) : (
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
            )}
        </button>
    )
}
