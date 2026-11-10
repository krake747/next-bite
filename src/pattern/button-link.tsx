import { createLink } from "@tanstack/react-router"

import { button } from "@ui/button.variants"
import { type VariantProps } from "@ui/cva.config"

type ButtonLinkBaseProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
    VariantProps<typeof button> & {
        readonly ref?: React.Ref<HTMLAnchorElement> | undefined
    }

function ButtonLinkBase({ tone, size, className, children, ref, href, ...props }: Readonly<ButtonLinkBaseProps>) {
    return (
        <a
            ref={ref}
            href={href === "" ? undefined : href}
            data-slot="button-link"
            className={button({ tone, size, class: className })}
            {...props}
        >
            {children}
        </a>
    )
}

export const ButtonLink = createLink(ButtonLinkBase)
