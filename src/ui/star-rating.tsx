import { createSignal, For } from "solid-js"

function StarEmpty(props: { class?: string }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 30 30"
            class={props.class}
        >
            <path
                style="fill:none;stroke-width:2;stroke-miterlimit:4"
                stroke="currentColor"
                d="m 21.274872,24.49862 -6.137031,-3.10843 -6.0398293,3.29332 1.0598483,-6.79722 -4.9985463,-4.72653 6.7920533,-1.09248 2.950558,-6.21448 3.137872,6.12203 6.822091,0.88577 -4.852742,4.87611 z"
            />
        </svg>
    )
}

function StarFull(props: { class?: string }) {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 30 30"
            class={props.class}
        >
            <path
                style="fill:#F49F0A;stroke:none"
                d="m 22.630603,26.30626 -7.47561,-3.78643 -7.3572061,4.01165 1.2910171,-8.2798 -6.0888041,-5.75745 8.2735021,-1.33077 3.594119,-7.56995 3.822288,7.45734 8.310092,1.07897 -5.911198,5.93965 z"
            />
        </svg>
    )
}

export function StarRating(props: {
    rating: number
    onRate: (rating: number) => void
}) {
    const [hoverRating, setHoverRating] = createSignal<number | null>(null)

    const displayRating = () => hoverRating() ?? props.rating

    return (
        <div
            class="flex items-center gap-0.5"
            onMouseLeave={() => setHoverRating(null)}
        >
            <For each={[1, 2, 3, 4, 5]}>
                {(star) => (
                    <button
                        type="button"
                        class="cursor-pointer p-0.5 transition-transform hover:scale-110"
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => props.onRate(star)}
                    >
                        {displayRating() >= star ? (
                            <StarFull />
                        ) : (
                            <StarEmpty class="text-neutral-400 dark:text-neutral-500" />
                        )}
                    </button>
                )}
            </For>
        </div>
    )
}
