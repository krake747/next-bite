import { act } from "@testing-library/react"
import { createRoot, type Root } from "react-dom/client"

// The root route renders a full <html> document. React 19 can mount that
// onto `document` itself. RTL's default div (or documentElement) would nest
// <html> inside another element and warn.
let currentRoot: Root | null = null

export function renderDocument(ui: React.ReactElement): void {
    unmountDocument()
    currentRoot = createRoot(document)
    act(() => {
        currentRoot?.render(ui)
    })
}

export function unmountDocument(): void {
    if (currentRoot === null) {
        return
    }
    const root = currentRoot
    currentRoot = null
    act(() => {
        root.unmount()
    })
}
