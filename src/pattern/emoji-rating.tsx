import { useState } from "react"

import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

const RATING_EMOJIS = ["🚑", "💩", "🤡", "😐", "😏", "😍", "🍆"] as const

const EMOJI_LABELS = [
    "1 out of 7 - Terrible",
    "2 out of 7 - Bad",
    "3 out of 7 - Poor",
    "4 out of 7 - Okay",
    "5 out of 7 - Good",
    "6 out of 7 - Great",
    "7 out of 7 - Amazing",
] as const

const EMOJI_TITLES: Record<(typeof RATING_EMOJIS)[number], string> = {
    "🚑": 'That place is "call an ambalamb" bad',
    "💩": "The bathroom is nicer than the kitchen",
    "🤡": "We got clowned, what are we even doing here?",
    "😐": "The Switzerland of ratings. I'd rather eat the receipt",
    "😏": "Better than expected, would hit it again",
    "😍": "Chef's kiss? Nah, chef's whole tongue",
    "🍆": "The food was horny and now so am I",
}

const RATING_COLORS = [
    "oklch(0.5234 0.1645 33.24)",
    "oklch(0.6248 0.171 33.01)",
    "oklch(0.6662 0.1742 33.01)",
    "oklch(0.4088 0.1165 30.94)",
    "oklch(0.7427 0.1359 32.07)",
    "oklch(0.8339 0.0834 31.75)",
    "oklch(0.9446 0.0248 29.93)",
] as const

type FocusableButton = Readonly<{
    readonly focus: (options: Readonly<{ readonly preventScroll: boolean }>) => void
}>

type RateClickEvent = Readonly<{
    readonly preventDefault: () => void
    readonly currentTarget: FocusableButton
}>

export function EmojiRating({
    rating,
    defaultRating,
    onRate,
    disabled,
    className,
}: Readonly<{
    rating?: number | undefined
    defaultRating?: number | undefined
    onRate: (rating: number) => void | Promise<void>
    disabled?: boolean | undefined
    className?: string | undefined
}>) {
    const [hoverRating, setHoverRating] = useState<number | undefined>(undefined)
    const [uncontrolled, setUncontrolled] = useState<number | undefined>(defaultRating)
    const isControlled = rating !== undefined
    const current = isControlled ? rating : uncontrolled
    const displayRating = hoverRating ?? current

    const selectedTitle = (() => {
        const idx = hoverRating ?? current
        if (idx === undefined) {
            return "Tap an emoji to rate"
        }
        const emoji = RATING_EMOJIS[idx]
        return emoji !== undefined ? EMOJI_TITLES[emoji] : ""
    })()

    const activeColor = displayRating !== undefined ? RATING_COLORS[displayRating] : "oklch(0.5234 0.1645 33.24)"

    const handleRate = async (index: number, button: FocusableButton) => {
        if (!isControlled) {
            setUncontrolled(index)
        }
        await onRate(index)
        button.focus({ preventScroll: true })
    }

    return (
        <div data-slot="emoji-rating" className={cx("flex w-full flex-col items-center gap-2", className)}>
            <div
                className="flex items-center gap-0.5"
                onMouseLeave={() => {
                    setHoverRating(undefined)
                }}
            >
                {RATING_EMOJIS.map((emoji, index) => {
                    const isActive = displayRating === index

                    return (
                        <button
                            key={emoji}
                            type="button"
                            disabled={disabled}
                            onMouseEnter={() => {
                                if (disabled !== true) {
                                    setHoverRating(index)
                                }
                            }}
                            onClick={(e: RateClickEvent) => {
                                e.preventDefault()
                                void handleRate(index, e.currentTarget)
                            }}
                            aria-label={EMOJI_LABELS[index]}
                            aria-pressed={isActive}
                            className={cx(
                                focusRing(),
                                "hit-area-2 flex size-8 cursor-pointer items-center justify-center rounded-control text-lg sm:size-9 sm:text-xl",
                                "disabled:cursor-not-allowed disabled:opacity-40",
                                isActive ? "opacity-100" : "opacity-40 grayscale hover:opacity-70",
                            )}
                            style={isActive ? { color: activeColor } : undefined}
                        >
                            {emoji}
                        </button>
                    )
                })}
            </div>
            <p className="max-w-full text-center text-sm leading-snug font-medium text-balance text-tomato-700">
                {selectedTitle}
            </p>
        </div>
    )
}
