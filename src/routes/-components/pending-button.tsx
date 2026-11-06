import LoaderCircle from "lucide-react/icons/loader-circle"

import { Button } from "@ui/button"

export function PendingButton({
    pending,
    children,
    ...props
}: Readonly<{ pending: boolean | undefined } & Omit<React.ComponentProps<typeof Button>, "disabled" | "aria-busy">>) {
    return (
        <Button disabled={pending} aria-busy={pending} {...props}>
            {pending === true && <LoaderCircle className="size-4 animate-spin" />}
            {children}
        </Button>
    )
}
