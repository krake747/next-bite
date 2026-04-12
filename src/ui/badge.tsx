import { cva, cx, type VariantProps } from "./variants"
import { splitProps, type ComponentProps } from "solid-js"
import { Dynamic } from "solid-js/web"

const badge = cva({
    base: "inline-flex items-center rounded-full text-xs font-medium",
    variants: {
        variant: {
            primary: "bg-flame-pea-50 px-2 py-1 text-flame-pea-700 inset-ring inset-ring-flame-pea-700/10",
            gray: "bg-neutral-50 px-2 py-1 text-neutral-600 inset-ring inset-ring-neutral-500/10",
            pink: "bg-pink-50 px-2 py-1 text-pink-700 inset-ring inset-ring-pink-700/10",
            editorial: "bg-flame-pea-600 px-3 py-1.5 font-semibold tracking-wide text-white",
        },
    },
    defaultVariants: {
        variant: "primary",
    },
})

interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badge> {
    as?: string
}

export function Badge(props: BadgeProps) {
    const [local, rest] = splitProps(props, ["variant", "as", "class"])

    return (
        <Dynamic
            data-component="badge"
            {...rest}
            component={local.as ?? "span"}
            class={cx(badge({ variant: local.variant }), local.class)}
        >
            {props.children}
        </Dynamic>
    )
}
