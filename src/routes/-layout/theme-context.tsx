import { createContext, useContext, createSignal, onMount, type JSX } from "solid-js"

const ThemeKey = "next-bite-theme"

type Theme = "light" | "dark"

type ThemeContextValue = {
    theme: () => Theme
    toggleTheme: () => void
    isDark: () => boolean
}

const ThemeContext = createContext<ThemeContextValue>()

function isValidTheme(value: string | null): value is Theme {
    return value === "light" || value === "dark"
}

export function ThemeProvider(props: { children: JSX.Element }) {
    const [theme, setTheme] = createSignal<Theme>("light")

    onMount(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        const stored = localStorage.getItem(ThemeKey)

        const initial: Theme = isValidTheme(stored) ? stored : prefersDark ? "dark" : "light"
        setTheme(initial)
        document.documentElement.classList.toggle("dark", initial === "dark")
    })

    const toggleTheme = () => {
        const next = theme() === "dark" ? "light" : "dark"
        setTheme(next)
        document.documentElement.classList.toggle("dark", next === "dark")
        localStorage.setItem(ThemeKey, next)
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: () => theme() === "dark" }}>
            {props.children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
    return ctx
}
