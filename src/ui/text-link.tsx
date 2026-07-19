import { Link, type LinkProps } from "@tanstack/react-router"

export function TextLink(props: LinkProps) {
    return (
        <Link
            {...props}
            className="font-semibold text-flame-pea-600 transition-colors hover:text-flame-pea-500 dark:text-flame-pea-400 dark:hover:text-flame-pea-300"
        />
    )
}
