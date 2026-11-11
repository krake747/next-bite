import { Button } from "@ui/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@ui/sheet"

import { Demo } from "./demo-frame"

export const sheetMeta = {
    id: "sheet",
    group: "Components",
    title: "Sheet",
    body: "A panel that slides in from an edge for supporting tasks. Content pages scroll underneath a dimmed backdrop.",
    importPath: "src/ui/sheet.tsx",
    anatomy: [
        {
            element: "Sheet",
            description: "Owns the open state for the panel.",
        },
        {
            element: "SheetTrigger",
            description: "The button that slides the panel in.",
        },
        {
            element: "SheetContent",
            description: "The panel with its edge, plus an optional close button.",
        },
        {
            element: "SheetHeader",
            description: "Stacks the title and description at the top of the panel.",
        },
        {
            element: "SheetTitle",
            description: "Names the supporting task in display type.",
        },
        {
            element: "SheetDescription",
            description: "One line on what the panel holds.",
        },
        {
            element: "SheetFooter",
            description: "Pins actions to the bottom of the panel.",
        },
    ],
    props: [
        {
            name: "side",
            type: '"top" | "right" | "bottom" | "left"',
            default: '"right"',
            description: "Edge the SheetContent slides in from.",
        },
        {
            name: "showCloseButton",
            type: "boolean",
            default: "true",
            description: "Renders the dismiss button in the panel corner.",
        },
        {
            name: "open",
            type: "boolean",
            description: "Controlled open state on the Sheet root. Pair with onOpenChange.",
        },
    ],
    variants: [
        { name: "right", description: "The default for detail and edit panels." },
        { name: "left", description: "Navigation drawers on small screens." },
        { name: "bottom", description: "Short pickers a thumb can reach." },
    ],
    guidance: {
        whenToUse:
            "Handle a supporting task without losing the page behind it. Right fits detail and edit panels, bottom fits thumb-reach pickers, left holds small-screen navigation.",
        whenToAvoid:
            "Do not use for the main flow or for alerts; those get a page or a Dialog. One panel at a time; never stack a Sheet over a Dialog.",
        siblings: [{ id: "dialog", reason: "Choices needing full attention use Dialog, supporting tasks use Sheet." }],
    },
} as const

export function SheetDemo() {
    return (
        <Demo>
            <Sheet>
                <SheetTrigger render={<Button tone="outline">Filter spots</Button>} />
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Filter spots</SheetTitle>
                        <SheetDescription>Narrow the list without losing your place.</SheetDescription>
                    </SheetHeader>
                    <div className="p-5 text-sm text-muted-foreground">
                        <p>Open now, within a mile, under $30.</p>
                    </div>
                    <SheetFooter>
                        <Button tone="primary">Show 12 spots</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </Demo>
    )
}
