import { Button as BaseButton } from "@base-ui/react/button"

import { type VariantProps } from "@ui/cva.config"

import { iconButton } from "./icon-button.variants"

type IconButtonProps = VariantProps<typeof iconButton> &
    Omit<React.ComponentProps<typeof BaseButton>, "aria-label" | "type"> & {
        readonly label: string
    }

export function IconButton({ tone, size, label, title, className, children, ...props }: Readonly<IconButtonProps>) {
    return (
        <BaseButton
            data-slot="icon-button"
            type="button"
            aria-label={label}
            title={title ?? label}
            className={iconButton({ tone, size, class: className })}
            {...props}
        >
            {children}
        </BaseButton>
    )
}
