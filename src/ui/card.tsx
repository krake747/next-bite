import { type ComponentProps } from "solid-js"
import { cx } from "./variants"

export function Card(props: ComponentProps<"div">) {
    return (
        <div
            data-component="card"
            {...props}
            class={cx(
                "flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md dark:border dark:border-white/10 dark:bg-[#242321] dark:shadow-none",
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
            class={cx("border-t border-neutral-200/60 p-4 dark:border-white/10", props.class)}
        >
            {props.children}
        </div>
    )
}
