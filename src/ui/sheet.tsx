import { Dialog as BaseSheet } from "@base-ui/react/dialog"
import { XIcon } from "@phosphor-icons/react"

import { cx } from "@ui/cva.config"
import { IconButton } from "@ui/icon-button"

export function Sheet({ children, ...props }: BaseSheet.Root.Props) {
    return (
        <BaseSheet.Root data-slot="sheet" {...props}>
            {children}
        </BaseSheet.Root>
    )
}

export function SheetTrigger({ children, ...props }: BaseSheet.Trigger.Props) {
    return (
        <BaseSheet.Trigger data-slot="sheet-trigger" {...props}>
            {children}
        </BaseSheet.Trigger>
    )
}

export function SheetClose({ children, ...props }: BaseSheet.Close.Props) {
    return (
        <BaseSheet.Close data-slot="sheet-close" {...props}>
            {children}
        </BaseSheet.Close>
    )
}

function SheetPortal({ children, ...props }: BaseSheet.Portal.Props) {
    return (
        <BaseSheet.Portal data-slot="sheet-portal" {...props}>
            {children}
        </BaseSheet.Portal>
    )
}

function SheetOverlay({ className, ...props }: BaseSheet.Backdrop.Props) {
    return (
        <BaseSheet.Backdrop
            data-slot="sheet-overlay"
            className={cx("fixed inset-0 z-50 bg-scrim/50 backdrop-blur-sm transition-opacity duration-150", className)}
            {...props}
        />
    )
}

export function SheetContent({
    className,
    children,
    side = "right",
    showCloseButton = true,
    ...props
}: BaseSheet.Popup.Props & {
    side?: "top" | "right" | "bottom" | "left"
    showCloseButton?: boolean
}) {
    return (
        <SheetPortal>
            <SheetOverlay />
            <BaseSheet.Popup
                data-slot="sheet-content"
                data-side={side}
                className={cx(
                    "fixed z-50 flex flex-col bg-surface text-sm text-foreground shadow-popover transition-[transform,opacity] duration-200 ease-out-quad data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-2 data-[side=bottom]:data-starting-style:translate-y-2 data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:-translate-x-2 data-[side=left]:data-starting-style:-translate-x-2 data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-2 data-[side=right]:data-starting-style:translate-x-2 data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:-translate-y-2 data-[side=top]:data-starting-style:-translate-y-2 data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
                    className,
                )}
                {...props}
            >
                {children}
                {showCloseButton && (
                    <BaseSheet.Close
                        data-slot="sheet-close"
                        render={
                            <IconButton label="Close" tone="plain" className="absolute top-4 right-4">
                                <XIcon className="size-4" aria-hidden="true" />
                            </IconButton>
                        }
                    />
                )}
            </BaseSheet.Popup>
        </SheetPortal>
    )
}

export function SheetHeader({ children, className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="sheet-header" className={cx("flex flex-col gap-1.5 p-5", className)} {...props}>
            {children}
        </div>
    )
}

export function SheetFooter({ children, className, ...props }: React.ComponentProps<"div">) {
    return (
        <div data-slot="sheet-footer" className={cx("mt-auto flex flex-col gap-2 p-5", className)} {...props}>
            {children}
        </div>
    )
}

export function SheetTitle({ children, className, ...props }: BaseSheet.Title.Props) {
    return (
        <BaseSheet.Title
            data-slot="sheet-title"
            className={cx("font-display text-lg font-semibold text-balance text-foreground", className)}
            {...props}
        >
            {children}
        </BaseSheet.Title>
    )
}

export function SheetDescription({ children, className, ...props }: BaseSheet.Description.Props) {
    return (
        <BaseSheet.Description
            data-slot="sheet-description"
            className={cx("text-sm text-muted-foreground", className)}
            {...props}
        >
            {children}
        </BaseSheet.Description>
    )
}
