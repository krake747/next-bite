import { Button } from "@ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui/dropdown-menu"

import { Demo } from "./demo-frame"

export const dropdownMenuMeta = {
    id: "dropdown-menu",
    group: "Components",
    title: "Dropdown menu",
    body: "A short list of actions behind one button. Items stay scannable; destructive stays last and apart.",
    importPath: "src/ui/dropdown-menu.tsx",
    anatomy: [
        {
            element: "DropdownMenu",
            description: "Owns the open state for the menu.",
        },
        {
            element: "DropdownMenuTrigger",
            description: "The button that opens the menu, by render or by children.",
        },
        {
            element: "DropdownMenuContent",
            description: "The floating panel, positioned against the trigger.",
        },
        {
            element: "DropdownMenuItem",
            description: "One action. Marks the current choice with active and groups with inset.",
        },
    ],
    props: [
        {
            name: "variant",
            type: '"default" | "destructive"',
            default: '"default"',
            description: "Item tone. Destructive is reserved for removal.",
        },
        {
            name: "active",
            type: "boolean",
            default: "false",
            description: "Marks the item as the current choice on DropdownMenuItem.",
        },
        {
            name: "sideOffset",
            type: "number",
            default: "4",
            description: "Gap between the trigger and the panel.",
        },
    ],
    variants: [
        { name: "default", description: "Everyday actions." },
        { name: "destructive", description: "Removal. Always the last item." },
    ],
    guidance: {
        whenToUse: "Offer secondary actions that would clutter the page as buttons.",
        whenToAvoid: "Do not use for primary actions or for navigation with more than a few items.",
    },
} as const

export function DropdownMenuDemo() {
    return (
        <Demo>
            <DropdownMenu>
                <DropdownMenuTrigger render={<Button tone="outline">Group actions</Button>} />
                <DropdownMenuContent>
                    <DropdownMenuItem active>Rename group</DropdownMenuItem>
                    <DropdownMenuItem>Copy invite link</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">Leave group</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </Demo>
    )
}
