import { Button } from "@ui/button"
import { Popover, PopoverPanel, PopoverTrigger } from "@ui/popover"

import { Demo } from "./demo-frame"

export const popoverMeta = {
    id: "popover",
    group: "Components",
    title: "Popover",
    body: "Lightweight detail anchored to its trigger. Not a dialog: no focus trap, dismissed with a click away.",
    importPath: "src/ui/popover.tsx",
    anatomy: [
        {
            element: "Popover",
            description: "Owns the open state for the panel.",
        },
        {
            element: "PopoverTrigger",
            description: "The button that opens the panel, in plain, tinted, card, or avatar tone.",
        },
        {
            element: "PopoverPanel",
            description: "The floating panel, set off from the trigger by sideOffset.",
        },
    ],
    props: [
        {
            name: "tone",
            type: '"plain" | "tinted" | "card" | "avatar"',
            default: '"plain"',
            description: "Trigger shape for PopoverTrigger.",
        },
        {
            name: "sideOffset",
            type: "number",
            default: "4",
            description: "Gap between the trigger and the panel.",
        },
        {
            name: "open",
            type: "boolean",
            description: "Controlled open state on the Popover root. Pair with onOpenChange.",
        },
    ],
    variants: [
        { name: "plain", description: "A neutral trigger for panels and rows." },
        { name: "tinted", description: "A brand trigger that invites a tap." },
        { name: "card", description: "A full-width row trigger." },
        { name: "avatar", description: "A circular trigger for people." },
    ],
    guidance: {
        whenToUse:
            "Preview detail the user asked for, such as hours or a mini profile. Match the trigger tone to its context: plain for rows, tinted to invite a tap, card for full-width rows, avatar for people.",
        whenToAvoid:
            "Do not use for tasks with actions; that is a Dialog. Keep panels short and free of interactive content; anything needing buttons or inputs gets a Dialog or a page.",
        siblings: [{ id: "dialog", reason: "Tasks with actions use Dialog, previews use Popover." }],
    },
} as const

export function PopoverDemo() {
    return (
        <Demo>
            <Popover>
                <PopoverTrigger render={<Button tone="outline">Opening hours</Button>} />
                <PopoverPanel>
                    <div className="max-w-56 px-3 py-2 text-sm">
                        <p className="font-medium text-foreground">Osteria Nove</p>
                        <p className="mt-0.5 text-muted-foreground">Tue to Sun, 6pm to 11pm. Closed Mondays.</p>
                    </div>
                </PopoverPanel>
            </Popover>
        </Demo>
    )
}
