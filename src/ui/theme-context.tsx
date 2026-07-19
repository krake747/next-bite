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
    const [theme, setTheme] = useState<Theme>(() => {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        const stored = localStorage.getItem(ThemeKey)
        return isValidTheme(stored) ? stored : prefersDark ? "dark" : "light"
    })

    useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark")
    }, [theme])

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark"
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
