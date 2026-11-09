type DrawableContext = {
    readonly drawElementImage: (element: Element, x: number, y: number) => void
}

export function supportsHtmlInCanvas(): boolean {
    if (typeof document === "undefined") {
        return false
    }
    const canvas = document.createElement("canvas")
    canvas.setAttribute("content", "drawable")
    const context = canvas.getContext("2d")
    return "content" in canvas && context !== null && "drawElementImage" in context
}

export function paintPosterElement(
    context: CanvasRenderingContext2D | DrawableContext | null,
    element: Element,
): boolean {
    if (context === null) {
        return false
    }
    if (!("drawElementImage" in context)) {
        return false
    }
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
