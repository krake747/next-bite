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
                "font-semibold text-tomato-600 underline-offset-4 transition-colors duration-150 hover:text-tomato-500 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                className,
            )}
            viewTransition={viewTransition}
            {...props}
        />
    )
}
