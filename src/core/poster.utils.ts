declare global {
    interface HTMLCanvasElement {
        content?: string | undefined
    }

    interface CanvasRenderingContext2D {
        drawElementImage?(element: Element, x: number, y: number): void
    }
}

export function supportsHtmlInCanvas(): boolean {
    if (typeof document === "undefined") return false
    const canvas = document.createElement("canvas")
    canvas.setAttribute("content", "drawable")
    return canvas.content === "drawable"
}

export function paintPosterElement(context: CanvasRenderingContext2D | null, element: Element): boolean {
    if (context === null) return false
    if (typeof context.drawElementImage !== "function") return false
    context.drawElementImage(element, 0, 0)
    return true
}

export function buildPosterFileName(name: string): string {
    const slug = name
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "")
    return `${slug === "" ? "bite" : slug}-poster.png`
}
