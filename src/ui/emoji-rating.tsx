import { createSignal, For } from "solid-js"

const RATING_EMOJIS = ["🚑", "💩", "🤡", "😐", "😏", "😍", "🍆"] as const

const EMOJI_TITLES: Record<(typeof RATING_EMOJIS)[number], string> = {
    "🚑": 'That place is "call an ambalamb" bad',
    "💩": "The bathroom is nicer than the kitchen",
    "🤡": "We got clowned, what are we even doing here?",
    "😐": "The Switzerland of ratings. I'd rather eat the receipt",
    "😏": "Better than expected, would hit it again",
    "😍": "Chef's kiss? Nah, chef's whole tongue",
    "🍆": "The food was horny and now so am I",
}

export function EmojiRating(props: { rating: number | null; onRate: (rating: number) => void }) {
    const [hoverRating, setHoverRating] = createSignal<number | null>(null)

    const displayRating = () => hoverRating() ?? props.rating

    // hover > selected > fallback
    const selectedTitle = () => {
        const hoverIdx = hoverRating()
        if (hoverIdx !== null) {
            const hoverEmoji = RATING_EMOJIS[hoverIdx]
            return hoverEmoji !== undefined ? EMOJI_TITLES[hoverEmoji] : ""
        }

        const selectedIdx = props.rating
        if (selectedIdx !== null) {
            const selectedEmoji = RATING_EMOJIS[selectedIdx]
            return selectedEmoji !== undefined ? EMOJI_TITLES[selectedEmoji] : ""
        }

        return "No rating"
    }

    return (
        <div class="flex flex-col items-center gap-2">
            <div class="flex w-full items-center justify-between" onMouseLeave={() => setHoverRating(null)}>
                <For each={RATING_EMOJIS}>
                    {(emoji, index) => (
                        <button
                            type="button"
                            class={`cursor-pointer p-0.5 text-xl transition-transform hover:scale-125 ${
                                displayRating() === index() ? "opacity-100" : "opacity-30 grayscale"
                            }`}
                            onMouseEnter={() => setHoverRating(index())}
                            onClick={(e) => {
                                e.preventDefault()
                                props.onRate(index())
                            }}
                            title={EMOJI_TITLES[emoji as (typeof RATING_EMOJIS)[number]]}
                        >
                            {emoji}
                        </button>
                    )}
                </For>
            </div>
            <span class="text-sm text-gray-400">{selectedTitle()}</span>
        </div>
    )
}
