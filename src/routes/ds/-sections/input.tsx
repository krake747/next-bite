import { Input } from "@ui/input"
import { fieldLabel } from "@ui/variants"

import { Demo } from "./demo-frame"

export const inputMeta = {
    id: "input",
    group: "Components",
    title: "Input",
    body: "One line of user text. The control style carries border, focus, and disabled states; labels name the field.",
    importPath: "src/ui/input.tsx",
    anatomy: [
        {
            element: "Input",
            description: "A native input with the shared control style and a visible focus ring.",
        },
    ],
    props: [
        {
            name: "type",
            type: "string",
            description: "Native input type, such as text, email, or search.",
        },
        {
            name: "placeholder",
            type: "string",
            description: "A short hint shown while empty. Never a replacement for a label.",
        },
        {
            name: "disabled",
            type: "boolean",
            description: "Passed through to the native input with muted styling.",
        },
    ],
    guidance: {
        whenToUse:
            "Collect a single line of text with a visible label next to it. The control style carries border, focus, and disabled states, so pass only layout classes.",
        whenToAvoid:
            "Do not use for long text, choices, or dates; those get their own controls. Never use the placeholder as the label; the label stays visible.",
        siblings: [{ id: "button", reason: "Submit the collected value with Button." }],
    },
} as const

export function InputDemo() {
    return (
        <Demo>
            <div className="max-w-sm space-y-4">
                <div className="space-y-1.5">
                    <label htmlFor="ds-input-name" className={fieldLabel()}>
                        Group name
                    </label>
                    <Input id="ds-input-name" placeholder="Sunday supper club" />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="ds-input-disabled" className={fieldLabel()}>
                        Invite code
                    </label>
                    <Input id="ds-input-disabled" value="SUPPER-42" disabled />
                </div>
            </div>
        </Demo>
    )
}
