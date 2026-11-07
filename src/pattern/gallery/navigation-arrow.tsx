import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

export function NavigationArrow({
    direction,
    onClick,
    hidden,
    disabled,
    className,
    ...props
}: Readonly<
    {
        direction: "prev" | "next"
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
        hidden?: boolean | undefined
    } & Omit<React.ComponentProps<"button">, "onClick" | "children" | "type" | "aria-label">
>) {
    const isPrev = direction === "prev"
    const Icon = isPrev ? CaretLeftIcon : CaretRightIcon

    return (
        <IconButton
            label={`${direction} image`}
            tone="inverse"
            size="lg"
            onClick={onClick}
            disabled={disabled}
            className={cx("absolute z-10", isPrev ? "left-4" : "right-4", hidden === true && "hidden", className)}
            {...props}
        >
            <Icon className="size-5" aria-hidden="true" />
        </IconButton>
    )
}
