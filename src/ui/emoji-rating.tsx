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

export function EmojiRating(props: { rating: number | null; onRate: (rating: number) => void | Promise<void> }) {
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

    const handleRate = async (index: number, button: HTMLButtonElement) => {
        await props.onRate(index)
        // Restore focus to prevent scroll jump on re-render
        button.focus({ preventScroll: true })
    }

    return (
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between gap-1" onMouseLeave={() => setHoverRating(null)}>
                <For each={RATING_EMOJIS}>
                    {(emoji, index) => (
                        <button
                            type="button"
                            class={`cursor-pointer p-1 text-2xl transition-transform duration-150 hover:scale-110 focus:outline-none sm:text-2xl ${
                                displayRating() === index() ? "opacity-100" : "opacity-40 grayscale"
                            }`}
                            onMouseEnter={() => setHoverRating(index())}
                            onClick={(e) => {
                                e.preventDefault()
                                handleRate(index(), e.currentTarget)
                            }}
                            title={EMOJI_TITLES[emoji as (typeof RATING_EMOJIS)[number]]}
                        >
                            {emoji}
                        </button>
                    )}
                </For>
            </div>
            {/* Fixed height caption container - prevents layout shift */}
            <div class="flex h-10 items-center justify-center overflow-hidden">
                <span class="line-clamp-2 text-center text-sm leading-tight text-neutral-500 italic">
                    {selectedTitle()}
                </span>
            </div>
        </div>
    )
}
