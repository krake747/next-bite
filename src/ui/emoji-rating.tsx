import { createSignal, For } from "solid-js"

const RATING_EMOJIS = ["🚑", "💩", "🤡", "😐", "😏", "😍", "🍆"] as const

export function EmojiRating(props: { rating: number; onRate: (rating: number) => void }) {
    const [hoverRating, setHoverRating] = createSignal<number | null>(null)

    const displayRating = () => hoverRating() ?? props.rating

    return (
        <div class="flex w-full items-center justify-between" onMouseLeave={() => setHoverRating(null)}>
            <For each={RATING_EMOJIS}>
                {(emoji, index) => (
                    <button
                        type="button"
                        class={`cursor-pointer p-0.5 text-xl transition-transform hover:scale-125 ${
                            displayRating() === index() ? "opacity-100" : "opacity-30 grayscale"
                        }`}
                        onMouseEnter={() => setHoverRating(index())}
                        onClick={() => props.onRate(index())}
                        title={`Rate ${index()}`}
                    >
                        {emoji}
                    </button>
                )}
            </For>
        </div>
    )
}
