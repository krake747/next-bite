// SYNC: docs page lives in src/routes/ds/-sections/popover.tsx; keep the demo aligned with this file.
import { Popover as BasePopover } from "@base-ui/react/popover"

import { cx, type VariantProps } from "@ui/cva.config"

import { trigger } from "./popover.variants"

export function Popover({ children, ...props }: Readonly<React.ComponentProps<typeof BasePopover.Root>>) {
    return <BasePopover.Root {...props}>{children}</BasePopover.Root>
}

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
    React.ComponentProps<typeof BasePopover.Positioner> & {
        readonly className?: string | undefined
        readonly sideOffset?: number | undefined
    }
>

export function PopoverPanel({ className, children, sideOffset, ...props }: PopoverPanelProps) {
    return (
        <BasePopover.Portal>
            <BasePopover.Positioner sideOffset={sideOffset ?? 4} className="isolate z-50" {...props}>
                <BasePopover.Popup
                    data-slot="popover-panel"
                    className={cx(
                        "z-50 rounded-panel border border-border bg-surface p-1 shadow-popover outline-none",
                        className,
                    )}
                >
                    {children}
                </BasePopover.Popup>
            </BasePopover.Positioner>
        </BasePopover.Portal>
    )
}
