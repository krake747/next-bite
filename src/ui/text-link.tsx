import { Link } from "@tanstack/react-router"

import { cx } from "@ui/variants"

type TextLinkProps = {
    readonly to: string
    readonly viewTransition?: boolean | undefined
    readonly className?: string | undefined
    readonly children?: React.ReactNode | undefined
}

export function TextLink({ className, viewTransition = false, ...props }: Readonly<TextLinkProps>) {
    return (
        <Link
            data-slot="text-link"
            className={cx(
                "font-semibold text-flame-pea-600 transition-colors hover:text-flame-pea-500 dark:text-flame-pea-400 dark:hover:text-flame-pea-300",
                className,
            )}
            viewTransition={viewTransition}
            {...props}
        />
    )
}
