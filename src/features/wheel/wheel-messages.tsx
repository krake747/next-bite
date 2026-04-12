export function Instructions() {
    return (
        <p class="max-w-md text-center text-neutral-600 dark:text-neutral-400">
            Give the wheel a whirl and let fate (or your stomach) decide which restaurant wins today.
        </p>
    )
}

export function WinnerMessage() {
    return (
        <div class="animate-fade-in text-center">
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white">Winner!</h2>
        </div>
    )
}
