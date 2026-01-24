import Moon from "lucide-solid/icons/moon"
import Sun from "lucide-solid/icons/sun"
import { createSignal, onMount } from "solid-js"
import { Theme } from "../ui/constants"

export function DarkModeToggle() {
    const [dark, setDark] = createSignal(false)

    onMount(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        const storedTheme = localStorage.getItem(Theme)

        const isDark = storedTheme === "dark" || (!storedTheme && prefersDark)
        setDark(isDark)
        document.documentElement.classList.toggle("dark", isDark)
    })

    const toggle = () => {
        const next = !dark()
        setDark(next)
        document.documentElement.classList.toggle("dark", next)
        localStorage.setItem(Theme, next ? "dark" : "light")
    }

    return (
        <button
            class="flex cursor-pointer items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400"
            onClick={toggle}
        >
            {dark() ? <Sun class="size-4 text-amber-400" /> : <Moon class="size-4 text-neutral-900" />}
            {dark() ? "Light" : "Dark "}
        </button>
    )
}
