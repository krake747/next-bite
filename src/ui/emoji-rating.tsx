import { createSignal, For } from "solid-js"
import { cx } from "./variants"

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
    "#b53920", // flame-pea-700 - terrible (deep red)
    "#db573d", // flame-pea-600 - bad
    "#eb6348", // flame-pea-500 - meh
    "#7d2b1f", // muted brown-red - neutral
    "#f58974", // flame-pea-400 - good
    "#fab5a7", // flame-pea-300 - great (soft peach)
    "#fde7e3", // flame-pea-100 - amazing (warm cream)
] as const

export function EmojiRating(props: { rating: number | null; onRate: (rating: number) => void | Promise<void> }) {
    const [hoverRating, setHoverRating] = createSignal<number | null>(null)

    const displayRating = () => hoverRating() ?? props.rating

    const selectedTitle = () => {
        const idx = hoverRating() ?? props.rating
        if (idx === null) return "Tap an emoji to rate"
        const emoji = RATING_EMOJIS[idx]
        return emoji !== undefined ? EMOJI_TITLES[emoji] : ""
    }

    const activeColor = () => {
        const idx = displayRating()
        return idx !== null ? RATING_COLORS[idx] : "#b53920"
    }

    const handleRate = async (index: number, button: HTMLButtonElement) => {
        await props.onRate(index)
        button.focus({ preventScroll: true })
    }

    return (
        <div class="flex w-full flex-col items-center gap-2">
            <div class="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(null)}>
                <For each={RATING_EMOJIS}>
                    {(emoji, index) => {
                        const isActive = () => displayRating() === index()

                        return (
                            <button
                                type="button"
                                onMouseEnter={() => setHoverRating(index())}
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleRate(index(), e.currentTarget)
                                }}
                                aria-label={EMOJI_LABELS[index()]}
                                class={cx(
                                    "flex size-8 items-center justify-center text-lg transition-all duration-200 focus:outline-none sm:size-9 sm:text-xl",
                                    isActive() ? "scale-110" : "hover:scale-105",
                                    isActive()
                                        ? "opacity-100"
                                        : "opacity-40 grayscale hover:opacity-70 hover:grayscale-50",
                                )}
                                style={isActive() ? { color: activeColor() } : undefined}
                            >
                                {emoji}
                            </button>
                        )
                    }}
                </For>
            </div>
            <p class="max-w-full text-center text-sm leading-snug font-medium text-flame-pea-700 italic transition-colors duration-200 dark:text-flame-pea-400">
                {selectedTitle()}
            </p>
        </div>
    )
}
