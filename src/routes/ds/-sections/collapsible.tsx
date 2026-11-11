import { Button } from "@ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@ui/collapsible"

import { Demo } from "./demo-frame"

export const collapsibleMeta = {
    id: "collapsible",
    group: "Components",
    title: "Collapsible",
    body: "Show and hide a detail inline without leaving the page. The trigger stays put; only the panel moves.",
    importPath: "src/ui/collapsible.tsx",
    anatomy: [
        {
            element: "Collapsible",
            description: "Owns the open state, controlled or uncontrolled.",
        },
        {
            element: "CollapsibleTrigger",
            description: "The button that toggles the panel.",
        },
        {
            element: "CollapsibleContent",
            description: "The panel that mounts when open.",
        },
    ],
    props: [
        {
            name: "defaultOpen",
            type: "boolean",
            description: "Starts the panel open in the uncontrolled case.",
        },
        {
            name: "open",
            type: "boolean",
            description: "Controlled open state. Pair with onOpenChange.",
        },
        {
            name: "onOpenChange",
            type: "(open: boolean) => void",
            description: "Reports every toggle for controlled use.",
        },
    ],
    guidance: {
        whenToUse: "Tuck secondary detail behind a toggle inside a page or card.",
        whenToAvoid: "Do not use for navigation or for content the user must see; hidden content is skipped content.",
    },
} as const

export function CollapsibleDemo() {
    return (
        <Demo>
            <Collapsible>
                <CollapsibleTrigger render={<Button tone="outline">Show details</Button>} />
                <CollapsibleContent>
                    <p className="pt-3 text-sm text-muted-foreground">
                        The kitchen closes at ten, but dessert runs until the last table leaves.
                    </p>
                </CollapsibleContent>
            </Collapsible>
        </Demo>
    )
}
