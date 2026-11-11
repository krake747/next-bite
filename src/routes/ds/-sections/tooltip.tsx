import { Button } from "@ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui/tooltip"

import { Demo } from "./demo-frame"

export const tooltipMeta = {
    id: "tooltip",
    group: "Components",
    title: "Tooltip",
    body: "A one-line explanation on hover or focus. Icon buttons and collapsed rails name themselves this way.",
    importPath: "src/ui/tooltip.tsx",
    anatomy: [
        {
            element: "TooltipProvider",
            description: "Sets the hover delay for every tooltip inside. Mount once near the shell.",
        },
        {
            element: "Tooltip",
            description: "Owns the open state for one tip.",
        },
        {
            element: "TooltipTrigger",
            description: "The element the tip describes.",
        },
        {
            element: "TooltipContent",
            description: "The floating tip, positioned by side with a small offset.",
        },
    ],
    props: [
        {
            name: "delay",
            type: "number",
            default: "0",
            description: "Hover delay in milliseconds on the TooltipProvider.",
        },
        {
            name: "side",
            type: '"top" | "right" | "bottom" | "left"',
            default: '"top"',
            description: "Where the TooltipContent sits relative to the trigger.",
        },
        {
            name: "sideOffset",
            type: "number",
            default: "4",
            description: "Gap between the trigger and the tip.",
        },
    ],
    guidance: {
        whenToUse:
            "Name an icon-only control or explain a label that cannot grow. One line on hover or focus; mount one provider near the shell to set the delay.",
        whenToAvoid:
            "Do not use for paragraphs or actions; tips disappear and never hold interactive content. For previews with rich content, use a Popover.",
    },
} as const

export function TooltipDemo() {
    return (
        <Demo>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger render={<Button tone="outline">Invite friends</Button>} />
                    <TooltipContent>Copy a link your friends can join with</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </Demo>
    )
}
