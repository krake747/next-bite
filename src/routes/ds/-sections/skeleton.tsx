import { Skeleton } from "@ui/skeleton"

import { Demo } from "./demo-frame"

export const skeletonMeta = {
    id: "skeleton",
    group: "Components",
    title: "Skeleton",
    body: "A pulsing stand-in with the shape of what is coming. Page skeletons mirror the layout so nothing jumps.",
    importPath: "src/ui/skeleton.tsx",
    anatomy: [
        {
            element: "Skeleton",
            description: "A rounded block with a soft pulse. Size it like the content it stands in for.",
        },
    ],
    props: [
        {
            name: "children",
            type: "React.ReactNode",
            description: "Rarely used; skeletons are usually empty blocks.",
        },
        {
            name: "className",
            type: "string",
            description: "Sizes the block, such as h-4 w-32, merged onto the pulse.",
        },
    ],
    guidance: {
        whenToUse: "Hold the shape of content on first paint when no cached data can render.",
        whenToAvoid:
            "Do not use for short waits with known shape or when cached content can show instead; see loading.",
    },
} as const

export function SkeletonDemo() {
    return (
        <Demo>
            <div className="max-w-sm space-y-3" aria-label="Loading preview">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex items-center gap-3 pt-1">
                    <Skeleton className="size-10 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
        </Demo>
    )
}
