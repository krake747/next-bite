import ChevronLeft from "lucide-react/icons/chevron-left"
import ChevronRight from "lucide-react/icons/chevron-right"

import { cx } from "@ui/cva.config"

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
        disabled?: boolean | undefined
        className?: string | undefined
    } & Omit<React.ComponentProps<"button">, "onClick" | "disabled" | "className" | "children" | "type">
>) {
    const isPrev = direction === "prev"
    const Icon = isPrev ? ChevronLeft : ChevronRight

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cx(
                "absolute z-10 rounded-full bg-surface/20 p-3 text-white backdrop-blur-sm transition-colors duration-150 ease hover:bg-surface/30",
                isPrev ? "left-4" : "right-4",
                hidden === true && "hidden",
                className,
            )}
            aria-label={`${direction} image`}
            {...rest}
        >
            <Icon className="size-6" aria-hidden="true" />
        </button>
    )
}
