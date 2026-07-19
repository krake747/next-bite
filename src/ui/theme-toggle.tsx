import Moon from "lucide-react/icons/moon"
import Sun from "lucide-react/icons/sun"

import { useTheme } from "./theme-context"

export function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme()

    return (
        <button
            type="button"
            className="flex cursor-pointer items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        >
            {isDark ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-neutral-900" />}
            {isDark ? "Light" : "Dark"}
        </button>
    )
}
