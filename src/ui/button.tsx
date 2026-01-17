import { Root } from "@kobalte/core/button"
import { cva } from "./variants"
import { type ComponentProps } from "solid-js"

const button = cva({
    base: "font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 dark:shadow-none 0",
    variants: {
        variant: {
            primary:
                "text-white bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600 dark:bg-indigo-500  dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-50",
        },
        size: {
            md: "rounded-md px-2.5 py-1.5 text-sm",
            lg: "rounded-md px-3 py-2 text-sm",
        },
    },
    defaultVariants: {
        variant: "primary",
        size: "lg",
    },
})

export function Button(props: ComponentProps<typeof Root>) {
    return (
        <Root {...props} data-component="button" class={button({ size: "lg", class: props.class })}>
            {props.children}
        </Root>
    )
}
