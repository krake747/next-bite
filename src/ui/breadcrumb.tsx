// SYNC: docs page lives in src/routes/ds/-sections/breadcrumb.tsx; keep the demo aligned with this file.
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { CaretRightIcon, DotsThreeIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"

export function Breadcrumb({ children, className, ...props }: React.ComponentProps<"nav">) {
    return (
        <nav
            aria-label="breadcrumb"
            data-slot="breadcrumb"
            className={cx("min-w-0 flex-1 overflow-hidden", className)}
            {...props}
        >
            {children}
        </nav>
    )
}

export function BreadcrumbList({ children, className, ...props }: React.ComponentProps<"ol">) {
    return (
        <ol
            data-slot="breadcrumb-list"
            className={cx(
                "flex flex-nowrap items-center gap-1.5 overflow-hidden text-sm text-muted-foreground sm:gap-2.5",
                className,
            )}
            {...props}
        >
            {children}
        </ol>
    )
}

export function BreadcrumbItem({ children, className, ...props }: React.ComponentProps<"li">) {
    return (
        <li data-slot="breadcrumb-item" className={cx("flex shrink-0 items-center gap-1.5", className)} {...props}>
            {children}
        </li>
    )
}

export function BreadcrumbLink({ className, render, ...props }: useRender.ComponentProps<"a">) {
    return useRender({
        defaultTagName: "a",
        props: mergeProps<"a">(
            {
                className: cx("block min-w-0 truncate transition-colors hover:text-foreground", className),
            },
            props,
        ),
        render,
        state: {
            slot: "breadcrumb-link",
        },
    })
}

export function BreadcrumbPage({ children, className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="breadcrumb-page"
            aria-disabled="true"
            aria-current="page"
            className={cx("block min-w-0 truncate font-normal text-foreground", className)}
            {...props}
        >
            {children}
        </span>
    )
}

export function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
    return (
        <li
            data-slot="breadcrumb-separator"
            role="presentation"
            aria-hidden="true"
            className={cx("shrink-0 [&>svg]:size-3.5", className)}
            {...props}
        >
            {children ?? <CaretRightIcon />}
        </li>
    )
}

export function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="breadcrumb-ellipsis"
            role="presentation"
            aria-hidden="true"
            className={cx("flex size-5 items-center justify-center [&>svg]:size-4", className)}
            {...props}
        >
            <DotsThreeIcon />
            <span className="sr-only">More</span>
        </span>
    )
}
