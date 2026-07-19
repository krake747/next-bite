import { Link } from "@tanstack/react-router"
import type { ComponentProps } from "react"

import { cx } from "@ui/variants"

type TextLinkProps = ComponentProps<typeof Link>

export function TextLink({ className, ...props }: TextLinkProps) {
    return (
        <Link
            data-slot="text-link"
            className={cx(
                "font-semibold text-flame-pea-600 transition-colors hover:text-flame-pea-500 dark:text-flame-pea-400 dark:hover:text-flame-pea-300",
                className,
            )}
            {...props}
        />
    )
}
