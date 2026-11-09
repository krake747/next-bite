import { useRender } from "@base-ui/react/use-render"

import { cx } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

type TextLinkProps = useRender.ComponentProps<"a">

export function TextLink({ render, ref, className, children, ...props }: Readonly<TextLinkProps>) {
    return useRender({
        defaultTagName: "a",
        render,
        ref,
        state: { slot: "text-link" },
        props: {
            ...props,
            children,
            className: cx(
                focusRing(),
                "font-semibold text-tomato-600 decoration-from-font underline-offset-4 transition-colors duration-150 hover:text-tomato-500 hover:underline",
                className,
            ),
        },
    })
}
