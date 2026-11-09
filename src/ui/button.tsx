import { Button as BaseButton } from "@base-ui/react/button"

import { type VariantProps } from "@ui/cva.config"

import { button } from "./button.variants"

type ButtonProps = VariantProps<typeof button> & React.ComponentProps<typeof BaseButton>

export function Button({ tone, size, className, type, disabled, children, ...props }: Readonly<ButtonProps>) {
    return (
        <BaseButton
            data-slot="button"
            type={type ?? "button"}
            className={button({ tone, size, class: className })}
            disabled={disabled}
            {...props}
        >
            {children}
        </BaseButton>
    )
}
