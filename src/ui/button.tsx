import { Button as BaseButton } from "@base-ui/react/button"
import LoaderCircle from "lucide-react/icons/loader-circle"

import { cva, type VariantProps } from "@ui/variants"

const button = cva({
    base: "group inline-flex cursor-pointer items-center justify-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
    variants: {
        variant: {
            primary: "bg-tomato-700 text-white shadow-xs hover:bg-tomato-600",
            secondary: "bg-surface text-stone-900 shadow-xs inset-ring inset-ring-stone-300 hover:bg-stone-50",
            outline: "border border-border bg-surface text-stone-700 shadow-xs hover:bg-stone-50",
            ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        },
        size: {
            sm: "gap-x-1 rounded-control px-2.5 py-1 text-xs",
            md: "gap-x-1.5 rounded-control px-3 py-1.5 text-sm",
            lg: "gap-x-1.5 rounded-control px-4 py-2 text-sm",
            icon: "size-9 rounded-control",
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
    readonly loading?: boolean | undefined
    readonly nativeButton?: boolean | undefined
    readonly render?: React.ReactElement | undefined
    readonly className?: string | undefined
    readonly children?: React.ReactNode | undefined
}

export function Button({ variant, size, className, loading, disabled, children, ...rest }: Readonly<ButtonProps>) {
    return (
        <BaseButton
            data-slot="button"
            className={button({ variant, size, class: className })}
            disabled={disabled === true || loading === true}
            aria-busy={loading === true}
            {...rest}
        >
            {loading === true && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {children}
        </BaseButton>
    )
}
