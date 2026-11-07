import { Popover as BasePopover } from "@base-ui/react/popover"

import { cva, cx, type VariantProps } from "@ui/cva.config"
import { focusRing } from "@ui/variants"

export function Popover({ children, ...props }: Readonly<React.ComponentProps<typeof BasePopover.Root>>) {
    return <BasePopover.Root {...props}>{children}</BasePopover.Root>
}

const trigger = cva({
    base: "hit-area-2 inline-flex cursor-pointer items-center justify-center transition-colors duration-150",
    composes: [focusRing],
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
    ...props
}: Readonly<VariantProps<typeof trigger> & React.ComponentProps<typeof BasePopover.Trigger>>) {
    return (
        <BasePopover.Trigger data-slot="popover-trigger" className={cx(trigger({ tone }), className)} {...props}>
            {children}
        </BasePopover.Trigger>
    )
}

type PopoverPanelProps = Readonly<
    Omit<React.ComponentProps<typeof BasePopover.Positioner>, "children" | "className" | "sideOffset"> & {
        readonly className?: string | undefined
        readonly children?: React.ReactNode | undefined
        readonly sideOffset?: number | undefined
    }
>

export function PopoverPanel({ className, children, sideOffset, ...props }: PopoverPanelProps) {
    return (
        <BasePopover.Portal>
            <BasePopover.Positioner sideOffset={sideOffset ?? 4} {...props}>
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
