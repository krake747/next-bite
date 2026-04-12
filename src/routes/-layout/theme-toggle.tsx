import Moon from "lucide-solid/icons/moon"
import Sun from "lucide-solid/icons/sun"
import { useTheme } from "./theme-context"

export function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            class="flex cursor-pointer items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400"
            onClick={toggleTheme}
        >
            {isDark() ? <Sun class="size-4 text-amber-400" /> : <Moon class="size-4 text-neutral-900" />}
            {isDark() ? "Light" : "Dark "}
        </button>
    )
}
