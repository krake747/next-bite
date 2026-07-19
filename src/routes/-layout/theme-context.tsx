import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

const ThemeKey = "next-bite-theme"

type Theme = "light" | "dark"

type ThemeContextValue = {
    theme: Theme
    toggleTheme: () => void
    isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function isValidTheme(value: string | null): value is Theme {
    return value === "light" || value === "dark"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light")

    useEffect(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        const stored = localStorage.getItem(ThemeKey)

        const initial: Theme = isValidTheme(stored) ? stored : prefersDark ? "dark" : "light"
        setTheme(initial)
        document.documentElement.classList.toggle("dark", initial === "dark")
    }, [])

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark"
            document.documentElement.classList.toggle("dark", next === "dark")
            localStorage.setItem(ThemeKey, next)
            return next
        })
    }

    const value = { theme, toggleTheme, isDark: theme === "dark" }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
    return ctx
}
