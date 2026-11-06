import { getSchema } from "cva/tools"

import { PendingButton } from "@routes/-components/pending-button"
import { Button, button } from "@ui/button"
import { Card } from "@ui/card"

export const buttonsMeta = {
    id: "buttons",
    group: "Actions",
    title: "Buttons",
    body: "Primary is Tomato and reserved for the main action. Ghost stays chromeless. Every button carries a visible focus ring and an active press.",
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
        <Card>
            <div className="flex flex-wrap items-center gap-3 p-5">
                {buttonSchema.variant.values.map((variant) => (
                    <Button key={variant} variant={variant}>
                        {buttonLabels[variant]}
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
        </Card>
    )
}
