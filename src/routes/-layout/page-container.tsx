import type { JSX } from "solid-js"
import { cx } from "@ui/variants"

export function PageContainer(props: { children: JSX.Element; class?: string }) {
    return (
        <div
            data-component="page-container"
            class={cx("container mx-auto w-full max-w-350 px-4 pt-4 pb-6 sm:px-6 lg:px-12", props.class)}
        >
            {props.children}
        </div>
    )
}
