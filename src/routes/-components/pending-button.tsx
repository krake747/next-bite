import { CircleNotchIcon } from "@phosphor-icons/react"

import { Button } from "@ui/button"

export function PendingButton({
    pending,
    children,
    ...props
}: Readonly<{ pending: boolean | undefined } & Omit<React.ComponentProps<typeof Button>, "disabled" | "aria-busy">>) {
    return (
        <Button disabled={pending} aria-busy={pending} {...props}>
            {pending === true && <CircleNotchIcon className="size-4 animate-spin" />}
            {children}
        </Button>
    )
}
