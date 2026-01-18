import { createSignal, onMount } from "solid-js"
import { cx } from "../ui/variants"
import { Theme } from "./constants"

export function Loading() {
    const [isDark, setIsDark] = createSignal(false)

    onMount(() => {
        const stored = localStorage.getItem(Theme)
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setIsDark(stored === "dark" || (!stored && prefersDark))
    })

    return (
        <div
            class={cx(
                "fixed inset-0 z-50 flex flex-col items-center justify-center",
                isDark() ? "bg-neutral-900 text-neutral-100" : "bg-neutral-50 text-neutral-900",
            )}
        >
            <div
                class={cx(
                    "size-8 animate-spin rounded-full border-b-2",
                    isDark() ? "border-neutral-300" : "border-flame-pea-600",
                )}
            ></div>
            <p class="mt-4 text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
    )
}
