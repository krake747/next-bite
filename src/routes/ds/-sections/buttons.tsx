import { DotsThreeIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { getSchema } from "cva/tools"

import { PendingButton } from "@routes/-components/pending-button"
import { Button, button } from "@ui/button"
import { IconButton } from "@ui/icon-button"

import { Demo } from "./demo-frame"

export const buttonsMeta = {
    id: "buttons",
    group: "Actions",
    title: "Buttons",
    body: "Primary is Tomato and reserved for the main action. Ghost stays chromeless. Every button carries a visible focus ring and an active press.",
    importPath: "@ui/button · @ui/icon-button",
    anatomy: [
        { element: "Label", description: "Required. The visible text, also the accessible name." },
        { element: "Icon", description: "Optional leading icon that reinforces the label." },
    ],
    children: [
        { id: "button", title: "Button" },
        { id: "icon-button", title: "Icon button" },
    ],
} as const

const buttonSchema = getSchema(button)

const buttonLabels: Record<string, string> = {
    primary: "Primary",
    secondary: "Secondary",
    outline: "Outline",
    ghost: "Ghost",
    destructive: "Destructive",
}

export function ButtonsDemo() {
    return (
        <Demo className="space-y-6">
            <div id="button" role="group" aria-label="Button" className="flex flex-wrap items-center gap-3">
                {buttonSchema.tone.values.map((tone) => (
                    <Button key={tone} tone={tone}>
                        {buttonLabels[tone]}
                    </Button>
                ))}
                {buttonSchema.size.values.map((size) => (
                    <Button key={size} size={size}>
                        {size === "sm" ? "Small" : "Default"}
                    </Button>
                ))}
                <PendingButton pending>Loading</PendingButton>
                <Button disabled>Disabled</Button>
            </div>
            <div id="icon-button" role="group" aria-label="Icon button" className="flex flex-wrap items-center gap-3">
                <IconButton label="Add" tone="neutral">
                    <PlusIcon className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton label="Delete" tone="destructive">
                    <TrashIcon className="size-4" aria-hidden="true" />
                </IconButton>
                <IconButton label="More actions" tone="plain">
                    <DotsThreeIcon className="size-4" aria-hidden="true" />
                </IconButton>
            </div>
        </Demo>
    )
}
