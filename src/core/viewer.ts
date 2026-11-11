export type Viewer = { readonly kind: "signed-in"; readonly id: string } | { readonly kind: "signed-out" }

export function isViewer(viewer: Viewer, id: string): boolean {
    return viewer.kind === "signed-in" && viewer.id === id
}
