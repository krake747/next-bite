import { act } from "@testing-library/react"
import { createRoot, type Root } from "react-dom/client"

let currentRoot: Root | null = null

export function renderDocument(ui: React.ReactElement): {
    rerender: (next: React.ReactElement) => void
} {
    unmountDocument()
    currentRoot = createRoot(document)
    act(() => {
        currentRoot?.render(ui)
    })
    return {
        rerender: (next: React.ReactElement) => {
            act(() => {
                currentRoot?.render(next)
            })
        },
    }
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
