import { AspectRatio } from "@ui/aspect-ratio"

import { Demo } from "./demo-frame"

export const aspectRatioMeta = {
    id: "aspect-ratio",
    group: "Components",
    title: "Aspect ratio",
    body: "A frame that holds its proportions while the content loads or resizes, so media never jumps the layout.",
    importPath: "src/ui/aspect-ratio.tsx",
    anatomy: [
        {
            element: "Frame",
            description: "A div that sets the --ratio variable and keeps the box at those proportions.",
        },
        {
            element: "Content",
            description: "Anything rendered inside; images and fallbacks stretch to fill the frame.",
        },
    ],
    props: [
        {
            name: "ratio",
            type: "number",
            description: "Width divided by height, such as 16 / 9. Required.",
        },
        {
            name: "children",
            type: "React.ReactNode",
            description: "The media or placeholder the frame sizes.",
        },
        {
            name: "className",
            type: "string",
            description: "Extra classes merged onto the frame, for background and rounding.",
        },
    ],
    guidance: {
        whenToUse: "Reserve space for media with known proportions before it loads.",
        whenToAvoid: "Do not wrap plain text or cards; the frame clips anything that needs natural height.",
    },
} as const

export function AspectRatioDemo() {
    return (
        <Demo>
            <div className="overflow-hidden rounded-card bg-surface-muted">
                <AspectRatio ratio={16 / 9}>
                    <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                        16 by 9 frame
                    </div>
                </AspectRatio>
            </div>
        </Demo>
    )
}
