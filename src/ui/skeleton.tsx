import { type ComponentProps } from "solid-js"
import { cx } from "@ui/variants"

export function Skeleton(props: ComponentProps<"div">) {
    return <div {...props} class={cx("animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700", props.class)} />
}
