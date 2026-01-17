import { type ComponentProps } from "solid-js"
import { cx } from "./variants"

export function Card(props: ComponentProps<"div">) {
    return (
        <div
            data-component="card"
            {...props}
            class={cx(
                "flex flex-col divide-y divide-neutral-200 overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md dark:divide-white/10 dark:bg-neutral-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10",
                props.class,
            )}
        >
            {props.children}
        </div>
    )
}

export function CardHeader(props: ComponentProps<"div">) {
    return (
        <div data-component="card-header" {...props} class={cx("px-4 py-5 sm:px-6", props.class)}>
            {props.children}
        </div>
    )
}

export function CardContent(props: ComponentProps<"div">) {
    return (
        <div data-component="card-content" {...props} class={cx("px-4 py-5 sm:p-6", props.class)}>
            {props.children}
        </div>
    )
}

export function CardFooter(props: ComponentProps<"div">) {
    return (
        <div data-component="card-footer" {...props} class={cx("px-4 py-4 sm:px-6", props.class)}>
            {props.children}
        </div>
    )
}
