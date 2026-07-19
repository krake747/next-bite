import { useState } from "react"
import { cx } from "@ui/variants"

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

const RATING_COLORS = ["#b53920", "#db573d", "#eb6348", "#7d2b1f", "#f58974", "#fab5a7", "#fde7e3"] as const

export function EmojiRating({
    rating,
    onRate,
}: {
    rating: number | null
    onRate: (rating: number) => void | Promise<void>
}) {
    const [hoverRating, setHoverRating] = useState<number | null>(null)

    const displayRating = hoverRating ?? rating

    const selectedTitle = (() => {
        const idx = hoverRating ?? rating
        if (idx === null) return "Tap an emoji to rate"
        const emoji = RATING_EMOJIS[idx]
        return emoji !== undefined ? EMOJI_TITLES[emoji] : ""
    })()

    const activeColor = displayRating !== null ? RATING_COLORS[displayRating] : "#b53920"

    const handleRate = async (index: number, button: HTMLButtonElement) => {
        await onRate(index)
        button.focus({ preventScroll: true })
    }

    return (
        <div className="flex w-full flex-col items-center gap-2">
            <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(null)}>
                {RATING_EMOJIS.map((emoji, index) => {
                    const isActive = displayRating === index

                    return (
                        <button
                            key={index}
                            type="button"
                            onMouseEnter={() => setHoverRating(index)}
                            onClick={(e) => {
                                e.preventDefault()
                                void handleRate(index, e.currentTarget)
                            }}
                            aria-label={EMOJI_LABELS[index]}
                            className={cx(
                                "flex size-8 items-center justify-center text-lg transition-all duration-200 focus:outline-none sm:size-9 sm:text-xl",
                                isActive ? "scale-110" : "hover:scale-105",
                                isActive ? "opacity-100" : "opacity-40 grayscale hover:opacity-70 hover:grayscale-50",
                            )}
                            style={isActive ? { color: activeColor } : undefined}
                        >
                            {emoji}
                        </button>
                    )
                })}
            </div>
            <p className="max-w-full text-center text-sm leading-snug font-medium text-flame-pea-700 italic transition-colors duration-200 dark:text-flame-pea-400">
                {selectedTitle}
            </p>
        </div>
    )
}
