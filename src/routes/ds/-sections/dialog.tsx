import { Button } from "@ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@ui/dialog"

import { Demo } from "./demo-frame"

export const dialogMeta = {
    id: "dialog",
    group: "Components",
    title: "Dialog",
    body: "A focused task on top of the page. One dialog at a time, with a clear way out.",
    importPath: "src/ui/dialog.tsx",
    anatomy: [
        {
            element: "Dialog",
            description: "Owns the open state and traps focus while open.",
        },
        {
            element: "DialogTrigger",
            description: "The button that opens the dialog.",
        },
        {
            element: "DialogContent",
            description: "The panel with size, padding, backdrop tone, and an optional close button.",
        },
        {
            element: "DialogHeader",
            description: "Stacks the title and description with room to breathe.",
        },
        {
            element: "DialogTitle",
            description: "Names the task in display type.",
        },
        {
            element: "DialogDescription",
            description: "One line on what happens next.",
        },
        {
            element: "DialogFooter",
            description: "Lines up the actions, primary last.",
        },
    ],
    props: [
        {
            name: "open",
            type: "boolean",
            description: "Controlled open state on the Dialog root. Pair with onOpenChange.",
        },
        {
            name: "size",
            type: '"sm" | "md" | "full"',
            default: '"md"',
            description: "Panel width on the DialogContent.",
        },
        {
            name: "padding",
            type: '"none" | "sm" | "md"',
            default: '"md"',
            description: "Inner spacing on the DialogContent.",
        },
        {
            name: "showCloseButton",
            type: "boolean",
            default: "true",
            description: "Renders the dismiss button in the panel corner.",
        },
    ],
    variants: [
        { name: "size sm", description: "Confirmations and short forms." },
        { name: "size md", description: "The default for most tasks." },
        { name: "tone deep", description: "A heavier backdrop when the choice needs full attention." },
    ],
    guidance: {
        whenToUse: "Confirm or collect something that cannot live inline on the page.",
        whenToAvoid: "Do not stack dialogs or open one from another; finish the first task first.",
    },
} as const

export function DialogDemo() {
    return (
        <Demo>
            <Dialog>
                <DialogTrigger render={<Button tone="outline">Leave group</Button>} />
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Leave supper club?</DialogTitle>
                        <DialogDescription>Your saved spots stay on your profile.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button tone="ghost">Stay</Button>
                        <Button tone="destructive">Leave</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Demo>
    )
}
