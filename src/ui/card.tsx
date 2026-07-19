import type { ComponentProps } from "react"
import { cx } from "@ui/variants"

export function Card({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-component="card"
            {...props}
            className={cx(
                "group relative flex flex-col overflow-hidden rounded-2xl bg-white",
                "shadow-[0_1px_2px_rgba(0,0,0,0.02),0_4px_8px_rgba(0,0,0,0.03),0_8px_16px_rgba(0,0,0,0.02)]",
                "transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.03)]",
                "dark:border dark:border-white/8 dark:bg-[#262523] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]",
                "dark:hover:border-white/12 dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)]",
                className,
            )}
        />
    )
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
    return (
        <div
            data-component="card-footer"
            {...props}
            className={cx("border-t border-neutral-100/80 px-6 py-4 dark:border-white/6", className)}
        />
    )
}
