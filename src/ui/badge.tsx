import { useRender } from "@base-ui/react/use-render"

import { cx, type VariantProps } from "@ui/cva.config"

import { badge } from "./badge.variants"

type BadgeProps = VariantProps<typeof badge> & useRender.ComponentProps<"span">

export function Badge({ tone, className, children, ...props }: Readonly<BadgeProps>) {
    return useRender({
        defaultTagName: "span",
        state: { slot: "badge", variant: tone ?? "neutral" },
        props: {
            ...props,
            className: cx(badge({ tone }), className),
            children,
        },
    })
}
