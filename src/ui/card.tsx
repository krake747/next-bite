import { type ComponentProps } from "solid-js"
import { cx } from "./variants"

export function Card(props: ComponentProps<"div">) {
    return (
        <div
            data-component="card"
            {...props}
            class={cx(
                "group relative flex flex-col overflow-hidden rounded-2xl bg-white",
                // Sophisticated layered shadow for depth
                "shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.03),0_8px_16px_rgba(0,0,0,0.02)]",
                // Subtle shadow transition on hover - no transform
                "transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.03)]",
                // Dark mode: refined dark surface with subtle border
                "dark:border dark:border-white/[0.08] dark:bg-[#262523] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                "dark:hover:border-white/[0.12] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
                props.class,
            )}
        >
            {props.children}
        </div>
    )
}

export function CardFooter(props: ComponentProps<"div">) {
    return (
        <div
            data-component="card-footer"
            {...props}
            class={cx("border-t border-neutral-100/80 px-6 py-4 dark:border-white/[0.06]", props.class)}
        >
            {props.children}
        </div>
    )
}
