import { Popover as BasePopover } from "@base-ui/react/popover"

import { cva, cx, type VariantProps } from "@ui/variants"

export function Popover({ children }: Readonly<{ children?: React.ReactNode | undefined }>) {
    return <BasePopover.Root>{children}</BasePopover.Root>
}

const trigger = cva({
    base: "hit-area-2 inline-flex cursor-pointer items-center justify-center transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    variants: {
        tone: {
            plain: "rounded-control",
            tinted: "rounded-full bg-tomato-100 text-tomato-600 hover:bg-tomato-200",
        },
    },
    defaultVariants: {
        tone: "plain",
    },
})

export function PopoverTrigger({
    tone,
    className,
    children,
    ...rest
}: Readonly<{ className?: string | undefined; children?: React.ReactNode | undefined }> &
    VariantProps<typeof trigger> &
    Omit<React.ComponentProps<typeof BasePopover.Trigger>, "className" | "children" | "render">) {
    return (
        <BasePopover.Trigger data-slot="popover-trigger" className={cx(trigger({ tone }), className)} {...rest}>
            {children}
        </BasePopover.Trigger>
    )
}

type PopoverPanelProps = Readonly<{
    className?: string | undefined
    children?: React.ReactNode | undefined
    side?: "top" | "bottom" | "left" | "right" | undefined
    align?: "start" | "center" | "end" | undefined
    sideOffset?: number | undefined
}>

export function PopoverPanel({ className, children, side, align, sideOffset }: PopoverPanelProps) {
    return (
        <BasePopover.Portal>
            <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset ?? 4}>
                <BasePopover.Popup
                    data-slot="popover-panel"
                    className={cx(
                        "z-50 rounded-panel border border-border bg-surface py-2 shadow-popover outline-none",
                        className,
                    )}
                >
                    {children}
                </BasePopover.Popup>
            </BasePopover.Positioner>
        </BasePopover.Portal>
    )
}
