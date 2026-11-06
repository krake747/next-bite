import ChevronLeft from "lucide-react/icons/chevron-left"
import ChevronRight from "lucide-react/icons/chevron-right"

import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

export function NavigationArrow({
    direction,
    onClick,
    hidden,
    disabled,
    className,
    ...rest
}: Readonly<
    {
        direction: "prev" | "next"
        onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
        hidden?: boolean | undefined
    } & Omit<React.ComponentProps<"button">, "onClick" | "children" | "type" | "aria-label">
>) {
    const isPrev = direction === "prev"
    const Icon = isPrev ? ChevronLeft : ChevronRight

    return (
        <IconButton
            label={`${direction} image`}
            tone="inverse"
            size="lg"
            onClick={onClick}
            disabled={disabled}
            className={cx("absolute z-10", isPrev ? "left-4" : "right-4", hidden === true && "hidden", className)}
            {...rest}
        >
            <Icon className="size-6" />
        </IconButton>
    )
}
