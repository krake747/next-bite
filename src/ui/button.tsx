import { Root } from "@kobalte/core/button"
import { cva, type VariantProps } from "./variants"
import { splitProps, type ComponentProps } from "solid-js"

const button = cva({
    base: "cursor-pointer inline-flex items-center justify-center font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 dark:shadow-none",
    variants: {
        variant: {
            primary:
                "text-white bg-flame-pea-600 hover:bg-flame-pea-500 focus-visible:outline-flame-pea-600 dark:bg-flame-pea-500 dark:hover:bg-flame-pea-400 dark:focus-visible:outline-flame-pea-50",
            secondary:
                "bg-white text-neutral-900 inset-ring-neutral-300 hover:bg-neutral-50 dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20",
        },
        size: {
            md: "gap-x-1.5 rounded-md px-2.5 py-1.5 text-sm",
            lg: "gap-x-1.5 rounded-md px-3 py-2 text-sm",
        },
    },
    defaultVariants: {
        variant: "primary",
        size: "lg",
    },
})

interface ButtonProps extends ComponentProps<typeof Root>, VariantProps<typeof button> {}

export function Button(props: ButtonProps) {
    const [local, rest] = splitProps(props, ["variant", "size", "class"])

    return (
        <Root
            data-component="button"
            {...rest}
            class={button({ variant: local.variant, size: local.size, class: local.class })}
        >
            {props.children}
        </Root>
    )
}
