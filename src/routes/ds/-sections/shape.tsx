import { Card } from "@ui/card"

export const shapeMeta = {
    id: "shape",
    group: "Tokens",
    title: "Shape and elevation",
    body: "Restrained radius per surface, borders over heavy shadows, warm-tinted elevations.",
} as const

export function ShapeDemo() {
    return (
        <Card>
            <div className="flex flex-wrap gap-3 p-5">
                <div className="rounded-control border border-border bg-surface px-4 py-2 text-sm">control 10px</div>
                <div className="rounded-panel border border-border bg-surface px-4 py-2 text-sm">panel 14px</div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm">card 16px</div>
                <div className="rounded-dialog border border-border bg-surface px-4 py-2 text-sm">dialog 20px</div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-card">
                    card shadow
                </div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-popover">
                    popover shadow
                </div>
                <div className="rounded-card border border-border bg-surface px-4 py-2 text-sm shadow-dialog">
                    dialog shadow
                </div>
            </div>
        </Card>
    )
}
