import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"

import { IconButton } from "@ui/icon-button"

import { Demo } from "./demo-frame"

export const iconButtonMeta = {
    id: "icon-button",
    group: "Components",
    title: "Icon button",
    body: "An action with no visible label. The label prop names it for assistive tech, and the title shows it on hover.",
    importPath: "src/ui/icon-button.tsx",
    anatomy: [
        {
            element: "IconButton",
            description: "A native button that takes its accessible name from label, never from the icon.",
        },
    ],
    props: [
        {
            name: "label",
            type: "string",
            description: "Accessible name for the button. Required and always set.",
        },
        {
            name: "title",
            type: "string",
            description: "Hover tooltip. Falls back to the label when omitted.",
        },
        {
            name: "tone",
            type: '"neutral" | "destructive" | "plain" | "inverse"',
            default: '"neutral"',
            description: "Surface the button sits on.",
        },
        {
            name: "size",
            type: '"xs" | "sm" | "md" | "lg"',
            default: '"md"',
            description: "Button diameter.",
        },
    ],
    variants: [
        { name: "neutral", description: "Floating actions over content." },
        { name: "destructive", description: "Floating removal over content." },
        { name: "plain", description: "Inline actions in headers and rows." },
        { name: "inverse", description: "Actions on dark media." },
    ],
    guidance: {
        whenToUse:
            "Repeat an obvious action in tight space, such as close, add, or search. Match the tone to the surface: neutral floats over content, plain sits inline in headers and rows, destructive removes, inverse rides on dark media.",
        whenToAvoid:
            "Do not use when the action needs explaining; use a Button with a visible label instead, and never pair the icon with visible text. The accessible name comes from label, never from the icon alone.",
        siblings: [{ id: "button", reason: "Explained actions use Button with a visible label." }],
    },
} as const

export function IconButtonDemo() {
    return (
        <Demo>
            <div className="flex flex-wrap gap-2">
                <IconButton label="Search spots" tone="neutral">
                    <MagnifyingGlassIcon className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton label="Delete list" tone="destructive">
                    <TrashIcon className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton label="Add spot" tone="plain">
                    <PlusIcon className="size-4" aria-hidden="true" />
                </IconButton>
            </div>
        </Demo>
    )
}
