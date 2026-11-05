import { Button as BaseButton } from "@base-ui/react/button"

import { cva, type VariantProps } from "@ui/variants"

const button = cva({
    base: "group inline-flex cursor-pointer items-center justify-center font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97]",
    variants: {
        variant: {
            primary: "bg-tomato-700 text-white hover:bg-tomato-600 focus-visible:outline-tomato-700",
            secondary: "bg-surface text-stone-900 inset-ring-stone-300 hover:bg-stone-50",
            danger: "bg-red-600 text-white hover:bg-red-700",
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

type ButtonProps = VariantProps<typeof button> & {
    readonly type?: "button" | "submit" | "reset" | undefined
    readonly onClick?: (() => void) | undefined
    readonly disabled?: boolean | undefined
    readonly nativeButton?: boolean | undefined
    readonly className?: string | undefined
    readonly children?: React.ReactNode | undefined
}

export function Button({ variant, size, className, children, ...rest }: Readonly<ButtonProps>) {
    return (
        <BaseButton data-slot="button" className={button({ variant, size, class: className })} {...rest}>
            {children}
        </BaseButton>
    )
}
