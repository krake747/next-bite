import { Button } from "@ui/button"

import { Demo } from "./demo-frame"

export const buttonMeta = {
    id: "button",
    group: "Components",
    title: "Button",
    body: "The one way to trigger an action. Primary starts the main flow; every other tone steps down from there.",
    importPath: "src/ui/button.tsx",
    anatomy: [
        {
            element: "Button",
            description: "A native button with type button by default, so forms never submit by accident.",
        },
    ],
    props: [
        {
            name: "tone",
            type: '"primary" | "secondary" | "outline" | "ghost" | "destructive"',
            default: '"primary"',
            description: "Visual weight of the action.",
        },
        {
            name: "size",
            type: '"sm" | "md" | "lg"',
            default: '"lg"',
            description: "Padding and text size. Touch targets stay reachable at every size.",
        },
        {
            name: "disabled",
            type: "boolean",
            description: "Passed through to the native button with muted styling.",
        },
        {
            name: "render",
            type: "React.ReactElement",
            description: "Renders a router link or other element with button styling instead of a button.",
        },
    ],
    variants: [
        { name: "primary", description: "The single main action on screen." },
        { name: "secondary", description: "A supporting action next to primary." },
        { name: "outline", description: "A quiet action on plain surfaces." },
        { name: "ghost", description: "The least weight, for tertiary or repeated actions." },
        { name: "destructive", description: "An action that deletes or removes. Nothing else." },
    ],
    guidance: {
        whenToUse: "Trigger an action the user chose, exactly one primary per view.",
        whenToAvoid: "Do not use for navigation that looks like a link; pass render with a link instead.",
    },
} as const

export function ButtonDemo() {
    return (
        <Demo>
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Button tone="primary">Primary</Button>
                    <Button tone="secondary">Secondary</Button>
                    <Button tone="outline">Outline</Button>
                    <Button tone="ghost">Ghost</Button>
                    <Button tone="destructive">Delete</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button disabled>Saving</Button>
                </div>
            </div>
        </Demo>
    )
}
